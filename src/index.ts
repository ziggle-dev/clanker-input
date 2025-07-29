/**
 * Input tool - Platform-specific input dialog for getting user input
 */

import { createTool, ToolCategory, ToolCapability } from '@ziggler/clanker';
import * as child_process from 'child_process';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(child_process.exec);

/**
 * Input tool - Shows a platform-specific input dialog to get user input
 */
export default createTool()
    .id('input')
    .name('Get User Input')
    .description('Show a platform-specific input dialog to get arbitrary information from the user with support for text, password, and dropdown selection')
    .category(ToolCategory.Utility)
    .capabilities(ToolCapability.UserConfirmation)
    .tags('input', 'dialog', 'user', 'prompt', 'ask', 'dropdown', 'select', 'choice')

    // Arguments
    .stringArg('prompt', 'The prompt/question to show to the user', {required: true})
    .stringArg('default_value', 'Default value to pre-fill in the input field (optional)', {required: false})
    .stringArg('title', 'Title for the dialog window (optional)', {required: false, default: 'Input Required'})
    .booleanArg('password', 'Whether to mask the input for password entry (optional)', {
        required: false,
        default: false
    })
    .stringArrayArg('options', 'List of options for dropdown selection (optional)', {required: false})
    .stringArg('type', 'Type of input: text, password, or dropdown (optional)', {
        required: false,
        default: 'text'
    })

    // Examples
    .examples([
        {
            description: 'Ask for user\'s name',
            arguments: {
                prompt: 'What is your name?',
                title: 'Name Input',
                type: 'text'
            },
            result: 'User enters: John Doe'
        },
        {
            description: 'Ask for API key with password masking',
            arguments: {
                prompt: 'Please enter your API key:',
                title: 'API Key',
                type: 'password'
            },
            result: 'User enters masked input'
        },
        {
            description: 'Select from dropdown options',
            arguments: {
                prompt: 'Choose your favorite color:',
                title: 'Color Selection',
                type: 'dropdown',
                options: ['Red', 'Green', 'Blue', 'Yellow']
            },
            result: 'User selects: Blue'
        },
        {
            description: 'Select AI model from dropdown',
            arguments: {
                prompt: 'Select the AI model to use:',
                title: 'Model Selection',
                type: 'dropdown',
                options: ['eleven_turbo_v2_5', 'eleven_turbo_v2', 'eleven_multilingual_v2', 'eleven_monolingual_v1'],
                default_value: 'eleven_turbo_v2_5'
            },
            result: 'User selects: eleven_turbo_v2_5'
        },
        {
            description: 'Select voice from dropdown',
            arguments: {
                prompt: 'Choose a voice:',
                title: 'Voice Selection',
                type: 'dropdown',
                options: ['Rachel', 'Clyde', 'Domi', 'Dave', 'Fin', 'Bella', 'Antoni', 'Thomas']
            },
            result: 'User selects: Rachel'
        }
    ])
    
    // Execute
    .execute(async (args, context) => {
        const {prompt, default_value, title, password, options, type} = args as {
            prompt: string;
            default_value?: string;
            title?: string;
            password?: boolean;
            options?: string[];
            type?: string;
        };

        const platform = os.platform();
        context.logger?.debug(`Showing input dialog on ${platform}`);

        // Determine the actual input type
        const inputType = type || (password ? 'password' : 'text');
        
        // Validate dropdown options
        if (inputType === 'dropdown' && (!options || options.length === 0)) {
            return {
                success: false,
                error: 'Dropdown type requires options array'
            };
        }

        try {
            let result: string;

            switch (platform) {
                case 'darwin': // macOS
                    if (inputType === 'dropdown' && options) {
                        result = await showMacOSDropdown(prompt, options, default_value, title || 'Select Option');
                    } else {
                        result = await showMacOSDialog(prompt, default_value, title || 'Input Required', inputType === 'password');
                    }
                    break;

                case 'win32': // Windows
                    if (inputType === 'dropdown' && options) {
                        result = await showWindowsDropdown(prompt, options, default_value, title || 'Select Option');
                    } else {
                        result = await showWindowsDialog(prompt, default_value, title || 'Input Required', inputType === 'password');
                    }
                    break;

                case 'linux': // Linux
                    if (inputType === 'dropdown' && options) {
                        result = await showLinuxDropdown(prompt, options, default_value, title || 'Select Option');
                    } else {
                        result = await showLinuxDialog(prompt, default_value, title || 'Input Required', inputType === 'password');
                    }
                    break;

                default:
                    return {
                        success: false,
                        error: `Unsupported platform: ${platform}`
                    };
            }

            if (result === null || result === undefined) {
                return {
                    success: false,
                    error: 'User cancelled the input dialog'
                };
            }

            context.logger?.info(`User provided input: ${password ? '[HIDDEN]' : result}`);
            return {
                success: true,
                output: result,
                data: {input: result}
            };

        } catch (error) {
            context.logger?.error(`Failed to show input dialog: ${error instanceof Error ? error.message : String(error)}`);
            return {
                success: false,
                error: `Failed to show input dialog: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    })
    .build();

/**
 * Show input dialog on macOS using AppleScript
 */
async function showMacOSDialog(prompt: string, defaultValue?: string, title?: string, password?: boolean): Promise<string> {
    // Escape both single and double quotes properly for AppleScript
    const escapedPrompt = prompt
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');
    const escapedTitle = (title || 'Input Required')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');
    const escapedDefault = (defaultValue || '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');

    let script: string;
    if (password) {
        script = `osascript -e 'tell application "System Events" to display dialog "${escapedPrompt}" default answer "" with title "${escapedTitle}" with hidden answer' -e 'text returned of result'`;
    } else {
        script = `osascript -e 'tell application "System Events" to display dialog "${escapedPrompt}" default answer "${escapedDefault}" with title "${escapedTitle}"' -e 'text returned of result'`;
    }

    try {
        const {stdout} = await execAsync(script);
        return stdout.trim();
    } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.message.includes('User canceled')) {
            throw new Error('User cancelled the input dialog');
        }
        throw error;
    }
}

/**
 * Show input dialog on Windows using PowerShell
 */
async function showWindowsDialog(prompt: string, defaultValue?: string, title?: string, password?: boolean): Promise<string> {
    const escapedPrompt = prompt.replace(/'/g, "''");
    const escapedTitle = (title || 'Input Required').replace(/'/g, "''");
    const escapedDefault = (defaultValue || '').replace(/'/g, "''");

    let script: string;
    if (password) {
        // PowerShell script for password input
        script = `
            Add-Type -AssemblyName Microsoft.VisualBasic
            $secure = Read-Host '${escapedPrompt}' -AsSecureString
            $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
            $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
            Write-Output $plain
        `;
    } else {
        // PowerShell script for regular input
        script = `
            Add-Type -AssemblyName Microsoft.VisualBasic
            [Microsoft.VisualBasic.Interaction]::InputBox('${escapedPrompt}', '${escapedTitle}', '${escapedDefault}')
        `;
    }

    const {stdout} = await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
    const result = stdout.trim();

    // PowerShell might return empty string if cancelled
    if (result === '') {
        throw new Error('User cancelled the input dialog');
    }

    return result;
}

/**
 * Show input dialog on Linux using zenity or kdialog
 */
async function showLinuxDialog(prompt: string, defaultValue?: string, title?: string, password?: boolean): Promise<string> {
    // Try zenity first (GNOME)
    try {
        await execAsync('which zenity');
        return await showZenityDialog(prompt, defaultValue, title, password);
    } catch {
        // Try kdialog (KDE)
        try {
            await execAsync('which kdialog');
            return await showKdialogDialog(prompt, defaultValue, title, password);
        } catch {
            // Fallback to terminal input
            return await showTerminalInput(prompt, defaultValue, password);
        }
    }
}

/**
 * Show input dialog using zenity (GNOME)
 */
async function showZenityDialog(prompt: string, defaultValue?: string, title?: string, password?: boolean): Promise<string> {
    const args = [
        'zenity',
        '--entry',
        `--text="${prompt.replace(/"/g, '\\"')}"`,
        `--title="${(title || 'Input Required').replace(/"/g, '\\"')}"`
    ];

    if (defaultValue) {
        args.push(`--entry-text="${defaultValue.replace(/"/g, '\\"')}"`);
    }

    if (password) {
        args.push('--hide-text');
    }

    try {
        const {stdout} = await execAsync(args.join(' '));
        return stdout.trim();
    } catch (error) {
        if (error instanceof Error && (error.message.includes('code 1') || error.message.includes('code 255'))) {
            throw new Error('User cancelled the input dialog');
        }
        throw error;
    }
}

/**
 * Show input dialog using kdialog (KDE)
 */
async function showKdialogDialog(prompt: string, defaultValue?: string, title?: string, password?: boolean): Promise<string> {
    const args = [
        'kdialog',
        password ? '--password' : '--inputbox',
        `"${prompt.replace(/"/g, '\\"')}"`,
        defaultValue ? `"${defaultValue.replace(/"/g, '\\"')}"` : '""',
        `--title "${(title || 'Input Required').replace(/"/g, '\\"')}"`
    ];

    try {
        const {stdout} = await execAsync(args.join(' '));
        return stdout.trim();
    } catch (error) {
        if (error instanceof Error && error.message.includes('code 1')) {
            throw new Error('User cancelled the input dialog');
        }
        throw error;
    }
}

/**
 * Fallback to terminal input using read command
 */
async function showTerminalInput(prompt: string, defaultValue?: string, password?: boolean): Promise<string> {
    const script = password
        ? `read -s -p "${prompt.replace(/"/g, '\\"')}: " input && echo "$input"`
        : `read -p "${prompt.replace(/"/g, '\\"')} [${defaultValue || ''}]: " input && echo "\${input:-${defaultValue || ''}}"`;

    try {
        const {stdout} = await execAsync(script, {shell: '/bin/bash'});
        return stdout.trim();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        throw new Error('Failed to read input from terminal');
    }
}

/**
 * Show dropdown dialog on macOS using AppleScript
 */
async function showMacOSDropdown(prompt: string, options: string[], defaultValue?: string, title?: string): Promise<string> {
    const escapedPrompt = prompt
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');
    const escapedTitle = (title || 'Select Option')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');
    
    // Escape each option
    const escapedOptions = options.map(opt => 
        `"${opt.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "'\\''").replace(/\n/g, ' ')}"`
    ).join(', ');
    
    const defaultOption = defaultValue || options[0];
    const escapedDefault = defaultOption
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "'\\''")
        .replace(/\n/g, ' ');
    
    const script = `osascript -e 'tell application "System Events" to choose from list {${escapedOptions}} with prompt "${escapedPrompt}" with title "${escapedTitle}" default items {"${escapedDefault}"}' -e 'item 1 of result'`;
    
    try {
        const {stdout} = await execAsync(script);
        return stdout.trim();
    } catch (error) {
        if (error instanceof Error && error.message.includes('User canceled')) {
            throw new Error('User cancelled the selection dialog');
        }
        throw error;
    }
}

/**
 * Show dropdown dialog on Windows using PowerShell
 */
async function showWindowsDropdown(prompt: string, options: string[], defaultValue?: string, title?: string): Promise<string> {
    const escapedPrompt = prompt.replace(/'/g, "''");
    const escapedTitle = (title || 'Select Option').replace(/'/g, "''");
    
    // Create PowerShell array of options
    const optionsArray = options.map(opt => `'${opt.replace(/'/g, "''")}'`).join(',');
    
    const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        $form = New-Object System.Windows.Forms.Form
        $form.Text = '${escapedTitle}'
        $form.Size = New-Object System.Drawing.Size(350,200)
        $form.StartPosition = 'CenterScreen'
        
        $label = New-Object System.Windows.Forms.Label
        $label.Location = New-Object System.Drawing.Point(10,20)
        $label.Size = New-Object System.Drawing.Size(320,40)
        $label.Text = '${escapedPrompt}'
        $form.Controls.Add($label)
        
        $comboBox = New-Object System.Windows.Forms.ComboBox
        $comboBox.Location = New-Object System.Drawing.Point(10,70)
        $comboBox.Size = New-Object System.Drawing.Size(320,20)
        $comboBox.DropDownStyle = 'DropDownList'
        @(${optionsArray}) | ForEach-Object { $comboBox.Items.Add($_) | Out-Null }
        ${defaultValue ? `$comboBox.SelectedItem = '${defaultValue.replace(/'/g, "''")}'` : '$comboBox.SelectedIndex = 0'}
        $form.Controls.Add($comboBox)
        
        $okButton = New-Object System.Windows.Forms.Button
        $okButton.Location = New-Object System.Drawing.Point(175,120)
        $okButton.Size = New-Object System.Drawing.Size(75,23)
        $okButton.Text = 'OK'
        $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $form.AcceptButton = $okButton
        $form.Controls.Add($okButton)
        
        $cancelButton = New-Object System.Windows.Forms.Button
        $cancelButton.Location = New-Object System.Drawing.Point(255,120)
        $cancelButton.Size = New-Object System.Drawing.Size(75,23)
        $cancelButton.Text = 'Cancel'
        $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
        $form.CancelButton = $cancelButton
        $form.Controls.Add($cancelButton)
        
        $form.Topmost = $true
        $result = $form.ShowDialog()
        
        if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
            Write-Output $comboBox.SelectedItem
        }
    `;
    
    const {stdout} = await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
    const result = stdout.trim();
    
    if (result === '') {
        throw new Error('User cancelled the selection dialog');
    }
    
    return result;
}

/**
 * Show dropdown dialog on Linux using zenity or kdialog
 */
async function showLinuxDropdown(prompt: string, options: string[], defaultValue?: string, title?: string): Promise<string> {
    // Try zenity first
    try {
        await execAsync('which zenity');
        return await showZenityDropdown(prompt, options, defaultValue, title);
    } catch {
        // Try kdialog
        try {
            await execAsync('which kdialog');
            return await showKdialogDropdown(prompt, options, defaultValue, title);
        } catch {
            // Fallback to terminal selection
            return await showTerminalDropdown(prompt, options, defaultValue);
        }
    }
}

/**
 * Show dropdown using zenity (GNOME)
 */
async function showZenityDropdown(prompt: string, options: string[], defaultValue?: string, title?: string): Promise<string> {
    const args = [
        'zenity',
        '--list',
        '--radiolist',
        `--text="${prompt.replace(/"/g, '\\"')}"`,
        `--title="${(title || 'Select Option').replace(/"/g, '\\"')}"`,
        '--column=Select',
        '--column=Option'
    ];
    
    // Add options with selection state
    options.forEach(opt => {
        args.push(opt === defaultValue ? 'TRUE' : 'FALSE');
        args.push(`"${opt.replace(/"/g, '\\"')}"`);
    });
    
    try {
        const {stdout} = await execAsync(args.join(' '));
        return stdout.trim();
    } catch (error) {
        if (error instanceof Error && (error.message.includes('code 1') || error.message.includes('code 255'))) {
            throw new Error('User cancelled the selection dialog');
        }
        throw error;
    }
}

/**
 * Show dropdown using kdialog (KDE)
 */
async function showKdialogDropdown(prompt: string, options: string[], defaultValue?: string, title?: string): Promise<string> {
    const args = [
        'kdialog',
        '--combobox',
        `"${prompt.replace(/"/g, '\\"')}"`,
        ...options.map(opt => `"${opt.replace(/"/g, '\\"')}"`),
        `--title "${(title || 'Select Option').replace(/"/g, '\\"')}"`,
        defaultValue ? `--default "${defaultValue.replace(/"/g, '\\"')}"` : ''
    ].filter(arg => arg !== '');
    
    try {
        const {stdout} = await execAsync(args.join(' '));
        return stdout.trim();
    } catch (error) {
        if (error instanceof Error && error.message.includes('code 1')) {
            throw new Error('User cancelled the selection dialog');
        }
        throw error;
    }
}

/**
 * Fallback to terminal dropdown using select
 */
async function showTerminalDropdown(prompt: string, options: string[], defaultValue?: string): Promise<string> {
    const optionsList = options.map((opt, idx) => `${idx + 1}) ${opt}`).join('\n');
    const defaultIndex = defaultValue ? options.indexOf(defaultValue) + 1 : 1;
    
    const script = `
        echo "${prompt.replace(/"/g, '\\"')}"
        echo ""
        ${optionsList.split('\n').map(line => `echo "${line}"`).join('\n')}
        echo ""
        read -p "Select option [${defaultIndex}]: " selection
        selection=\${selection:-${defaultIndex}}
        
        case $selection in
            ${options.map((opt, idx) => `${idx + 1}) echo "${opt.replace(/"/g, '\\"')}";;`).join('\n            ')}
            *) echo "Invalid selection" >&2; exit 1;;
        esac
    `;
    
    try {
        const {stdout} = await execAsync(script, {shell: '/bin/bash'});
        const lines = stdout.trim().split('\n');
        return lines[lines.length - 1];
    } catch (error) {
        throw new Error('Failed to read selection from terminal');
    }
}