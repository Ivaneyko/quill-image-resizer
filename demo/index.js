import QuillImageResizer from '../dist/index';

const Quill = window.Quill;

Quill.register('modules/imageResizer', QuillImageResizer);

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['image'],
      [{ 'align': [] }]
    ],
    imageResizer: {}
  }
});