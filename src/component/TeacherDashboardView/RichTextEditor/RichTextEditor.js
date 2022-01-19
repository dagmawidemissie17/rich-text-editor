// Import React dependencies.
import React, { useMemo, useState, useCallback } from 'react';
// Import the Slate editor factory.
import { createEditor, Text } from 'slate';
// Import the Slate components and React plugin.
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import escapeHtml from 'escape-html';
import { CodeElement, DefaultElement } from './Elements';
import Leaf from './Leaf';
import CustomEditor from './EditorLogic';
import Toolbar from './Toolbar';

// Even though slateValue is not used in this component, it's used by Antd Form to keep track of custom component's value. So please keep and don't delete
const RichTextEditor = ({ slateValue = '', onChange, handleSlate }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  // Add the initial value when setting up our state.
  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'A line of text in a paragraph.' }],
    },
    {
      type: 'paragraph',
      children: [
        {
          text:
            "Since it's rich text, you can do things like turn a selection of text bold, or add a semantically rendered block quote in the middle of the page, like this:",
        },
      ],
    },
  ]);

  const triggerChange = (changedValue) => {
    onChange(changedValue.toString());
  };

  // TODO: refine serialize function
  const serialize = (node) => {
    let nodeText = escapeHtml(node.text);
    if (Text.isText(node)) {
      if (node.bold) {
        nodeText = `<strong>` + nodeText + `</strong>`;
      }

      if (node.italic) {
        nodeText = `<em>` + nodeText + `</em>`;
      }

      if (node.underline) {
        nodeText = `<u>` + nodeText + `</u>`;
      }

      if (node.highlight) {
        nodeText = `<mark>` + nodeText + `</mark>`;
      }

      if (node.strikethrough) {
        nodeText = `<del>` + nodeText + `</del>`;
      }

      return nodeText;
    }

    if (Array.isArray(node)) {
      return node.map((subNode) => serializeSubNode(subNode)).join('');
    }

    return serializeSubNode(node);
  };

  const serializeSubNode = (node) => {
    const children = node.children.map((n) => serialize(n)).join('');
    switch (node.type) {
      case 'link':
        return `<a href="${escapeHtml(node.url)}">${children}</a>`;
      case 'code':
        return `<pre><code>${children}</code></pre>`;
      default:
        return `<p>${children}</p>`;
    }
  };

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  // Define a leaf rendering function that is memoized with `useCallback`.
  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  return (
    <>
      <Toolbar editor={editor} />

      <div
        style={{
          border: '1px solid gray',
          padding: '0.5em',
          borderRadius: '8px',
          marginTop: '0.25em',
        }}
      >
        <Slate
          editor={editor}
          value={value}
          onChange={(newValue) => {
            setValue(newValue);
            const content = serialize(newValue);
            triggerChange(content);
            // handleSlate(content);
          }}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={(event) => {
              if (!event.ctrlKey) {
                return;
              }

              // eslint-disable-next-line default-case
              switch (event.key) {
                // When "`" is pressed, keep our existing code block logic.
                case '`': {
                  event.preventDefault();
                  CustomEditor.toggleCodeBlock(editor);
                  break;
                }

                // When "B" is pressed, bold the text in the selection.
                case 'b': {
                  event.preventDefault();
                  CustomEditor.toggleBoldMark(editor);
                  break;
                }
              }
            }}
          />
        </Slate>
      </div>
    </>
  );
};

export default RichTextEditor;
