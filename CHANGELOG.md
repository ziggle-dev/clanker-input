# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-07-30

### Added
- **Chained Questions**: New `questions` parameter to ask multiple questions in sequence
- Smart answer key generation from prompts (extracts meaningful keys like "name", "email", etc.)
- Partial answer return if user cancels mid-sequence
- Support for mixed input types in question chains (text, password, dropdown)

### Fixed
- Better error handling for invalid JSON arguments
- Prevents AI from concatenating multiple JSON objects in tool calls

### Examples
- Added examples for chained questions
- Story creation example with multiple inputs

## [1.1.0] - 2025-07-29

### Added
- Dropdown selection support with `type: 'dropdown'` and `options` array
- Support for all platforms (macOS, Windows, Linux)
- Interactive model and voice selection for tools like ElevenLabs TTS

## [1.0.0] - Initial Release

### Features
- Text input dialogs
- Password input with masking
- Default values
- Cross-platform support