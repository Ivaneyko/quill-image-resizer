# quill-image-resizer

A module for the Quill rich text editor that provides image resizing functionality.

## Installation

```bash
npm install quill-image-resizer
# or
yarn add quill-image-resizer
```

## Usage

To use this module with your Quill editor, you'll need to register it and include it in your Quill configuration.

```javascript
import Quill from 'quill';
import ImageResizer from 'quill-image-resizer'; // Assuming you've installed it

// Register the module with Quill
Quill.register('modules/imageResizer', ImageResizer);

// Initialize Quill with the module
const quill = new Quill('#editor', {
  theme: 'snow', // or 'bubble'
  modules: {
    toolbar: [
      // ... your toolbar options
      ['image']
    ],
    imageResizer: {
      // Optional: Add configuration options for the resizer here
      // e.g., handleColor: 'red',
      // displaySize: true
    }
  }
});
```

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.