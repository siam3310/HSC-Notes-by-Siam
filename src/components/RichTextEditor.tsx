'use client';
import React, { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load initial HTML content into the editor
    if (value) {
      const blocksFromHtml = htmlToDraft(value);
      const { contentBlocks, entityMap } = blocksFromHtml;
      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    }
  }, [value]);

  const onEditorStateChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    if (html !== '<p></p>') {
      onChange(html);
    } else {
      onChange('');
    }
  };

  if (!isMounted) {
    return null; // Don't render on the server
  }

  return (
    <div className="bg-card border rounded-md min-h-[300px]">
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        toolbarClassName="toolbar-class !bg-transparent !border-t-0 !border-x-0 !border-b"
        wrapperClassName="wrapper-class"
        editorClassName="editor-class !px-4"
        placeholder="Start writing your note here..."
      />
    </div>
  );
};

export default RichTextEditor;
