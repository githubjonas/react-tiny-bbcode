# react-tiny-bbcode

This aims to implement a simple, yet fully functional bbcode editor and parser for React.

## Installation
```
npm install react-tiny-bbcode
```
## Usage

Working example: https://codesandbox.io/s/react-tiny-bbcode-g4h94

### Simplest usage
```
import React from 'react';
import {Editor} from "react-tiny-bbcode";

export function MyBBcodeEditorPage(props) {
  return (
    <Editor preview={true} />
  );    
}
```

### More advanced usage
```
import React, { useState } from 'react';
import {Editor, Parser} from "react-tiny-bbcode";

export function MyBBcodeEditorPage(props) {
  const [bbcode, setBBcode] = useState();

  const update = (v) => {
    setBBcode(v);
  };

  return (
    <Editor
      onChange={update}
      button={{
        style: {
          paddingRight: 10,
          cursor: "pointer"
        }
      }}
      textarea={{
        style: {minWidth: 500, minHeight: 300}
      }}
    />
    <hr/>
    <Parser bbcode={bbcode} />
  );    
}
```

### \<Editor\> Component
| Parameter         | Type     | Description                                                       | Default    |
| ----------------- |--------- |------------------------------------------------------------------ | -----------|
| `onChange`        | function | Custom function to run when clicked, where `v` is the bbcode string                               | `(v)=>{}`  |
| `preview`         | boolean  | Set to true to automatically render a preview area below editor   | `false`    |
| `container`       | object   | props that will be applied to the surrounding editor container    | `{}`       |
| `buttonContainer` | object   | props that will be applied to the button container                | `{}`       |
| `button`          | object   | props that will be applied to each button                         | `{}`       |
| `textarea`        | object   | props that will be applied to the editor edit area                | `{}`       |
| `buttons`         | array    | array of button object to render, see below                       | `[...]`    |

### Buttons
The Editor comes with a few default buttons, but is easily expandable with custom buttons.
Below is an example of a few buttons implemented.
```
const buttons = [
  {
    caption: "<b>B</b>",
    tag: "b"
  },
  {
    caption: "<i>I</i>",
    tag: "i",
  },
  {
    caption: "<u>U</u>",
    tag: "u"
  },
  {
    caption: "{}",
    tag: "code"
  },
  {
    caption: "<span style=\"color: red\">C</span><span style=\"color: green\">O</span><span style=\"color: blue\">L</span>",
    tag: "color",
    onClick: () => {
      return prompt("Enter color name or code in format ##rrggbb:");
    }
  },
  {
    caption: "Img",
    tag: "img",
    onClick: () => {
      return prompt("align left, right or stretch (leave empty for default):");
    }
  }
];

return (
  <Editor buttons={buttons} />
);
```   

## Contribute and build
Contribute to this repository by sending pull requests my way! All help is welcome!

Make sure you have `webpack` installed on your host machine.
```
npm run-script build
```
Use `npm link` to link to a local frontend react project to be able to modify and test immediately.
