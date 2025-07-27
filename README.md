# Input Tool for Clanker

Platform-specific input dialog for getting user input in Clanker.

## Installation

```bash
clanker install ziggler/input
```

## Usage

### Basic Example

```bash
clanker -p "use input to ask for the user's name"
```

### Advanced Example

```bash
clanker -p "use input to ask for an API key with password masking"
```

## Arguments

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prompt | string | Yes | - | The prompt/question to show to the user |
| default_value | string | No | - | Default value to pre-fill in the input field |
| title | string | No | Input Required | Title for the dialog window |
| password | boolean | No | false | Whether to mask the input for password entry |

## Examples

### Example 1: Ask for User's Name

```bash
clanker -p "use input to ask 'What is your name?' with title 'Name Input'"
```

Expected output:
```
User input: John Doe
```

### Example 2: Ask for API Key with Password Masking

```bash
clanker -p "use input to ask 'Please enter your API key:' with password masking"
```

Expected output:
```
User input: (hidden)
```

### Example 3: Ask with Default Value

```bash
clanker -p "use input to ask 'Enter your email:' with default value 'user@example.com'"
```

Expected output:
```
User input: user@example.com
```

## Platform Support

The input tool uses platform-specific dialogs:

- **macOS**: Uses AppleScript with System Events
- **Windows**: Uses PowerShell with Microsoft.VisualBasic
- **Linux**: 
  - Tries zenity (GNOME) first
  - Falls back to kdialog (KDE)
  - Falls back to terminal input if neither is available

## Capabilities

This tool requires the following capabilities:
- UserConfirmation: Shows dialog to get user input

## Features

- **Platform-specific dialogs**: Native dialog boxes for better user experience
- **Password masking**: Secure input for sensitive information
- **Default values**: Pre-fill input fields with suggested values
- **Cancel detection**: Properly handles when user cancels the dialog
- **Fallback support**: Terminal input fallback for Linux systems without GUI dialogs

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ziggle-dev/clanker-input

# Install dependencies
cd clanker-input
npm install

# Build
npm run build
```

### Testing Locally

```bash
# Test the tool before submission
npm test
```

## Contributing

To contribute to this tool:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

For adding this tool to the official Clanker registry, please open an issue at:
https://github.com/ziggle-dev/clanker-tools

## License

MIT - See LICENSE file for details

## Author

Ziggler ([@ziggle-dev](https://github.com/ziggle-dev))