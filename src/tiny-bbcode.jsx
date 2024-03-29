import React, { useState, useEffect, useRef } from "react";

/**
 * Default buttons
 * @type {*[]}
 */
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
  }
];

/**
 * Parse bbcode to html
 * @param props.bbcode string to parse
 * @returns {*}
 * @constructor
 */
export function Parser(props) {
  return (
    <div {...props} dangerouslySetInnerHTML={{__html:
        parseBBCode(props.bbcode.replaceAll("<", "&lt;").replaceAll(">", "&gt;"))
    }} />
  );
}

/**
 * Render a bbcode editor
 * @param props
 * @returns {*}
 * @constructor
 */
export function Editor(props) {
  const [bbtext, setBbtext] = useState(props.value ? props.value : "");
  const taRef = useRef("");
  const[selection, setSelection] = useState();

  useEffect(() => {
    if (!selection) return;  // prevent running on start
    const {start, end} = selection;
    taRef.current.focus();
    taRef.current.setSelectionRange(start, end);
  }, [selection]);

  useEffect(() => {
    // update editor if user changes value programmatically
    setSelection(null);
    setBbtext(props.value || '');
    if (typeof props.onChange === 'function') {
      props.onChange(props.value || '');
    }
  }, [props.value]);

  const update = (e) => {
    setSelection(null);
    setBbtext(e.currentTarget.value);
    if (typeof props.onChange == 'function') {
      props.onChange(e.currentTarget.value);
    }
  };

  const click = (button) => {
    const start = taRef.current.selectionStart;
    const end = taRef.current.selectionEnd;
    let tag = button.tag;
    if (typeof button.onClick === 'function') {
      const v = button.onClick();
      if (v) {
        tag += `=${v}`;
      }
    }

    const openTag = `[${tag}]`;
    const closeTag = `[/${button.tag}]`;
    const newText = bbtext.substr(0, start) + openTag + bbtext.substr(start, end - start) + closeTag + bbtext.substr(end);
    setBbtext(newText);
    setSelection({start: start + openTag.length, end: end + openTag.length});

    if (typeof props.onChange == 'function') {
      props.onChange(newText);
    }
  };

  let renderButtons = props.buttons ? props.buttons : buttons;

  return (
    <div {...props.container} >
      <div {...props.buttonContainer} >
      {renderButtons.map((button, idx) => (
        <span {...props.button} key={idx} onClick={() => { click(button) }} dangerouslySetInnerHTML={{__html: button.caption}} />
      ))}
      </div>
      <textarea {...props.textarea} onChange={update} ref={taRef} value={bbtext} />
      {props.preview ? <Parser bbcode={bbtext} /> : null}
    </div>
  );
}

/*
 * THIS PORTIONS OF THE FILE IS UNDER A SEPARATE COPYRIGHT LICENSE
 */

// -----------------------------------------------------------------------
// Copyright (c) 2008, Stone Steps Inc.
// All rights reserved
// http://www.stonesteps.ca/legal/bsd-license/
//
// This is a BBCode parser written in JavaScript. The parser is intended
// to demonstrate how to parse text containing BBCode tags in one pass
// using regular expressions.
//
// The parser may be used as a backend component in ASP or in the browser,
// after the text containing BBCode tags has been served to the client.
//
// Following BBCode expressions are recognized:
//
// [b]bold[/b]
// [i]italic[/i]
// [u]underlined[/u]
// [s]strike-through[/s]
// [samp]sample[/samp]
//
// [color=red]red[/color]
// [color=#FF0000]red[/color]
// [size=1.2]1.2em[/size]
//
// [url]http://blogs.stonesteps.ca/showpost.asp?pid=33[/url]
// [url=http://blogs.stonesteps.ca/showpost.asp?pid=33][b]BBCode[/b] Parser[/url]
//
// [q=http://blogs.stonesteps.ca/showpost.asp?pid=33]inline quote[/q]
// [q]inline quote[/q]
// [blockquote=http://blogs.stonesteps.ca/showpost.asp?pid=33]block quote[/blockquote]
// [blockquote]block quote[/blockquote]
//
// [pre]formatted
//     text[/pre]
// [code]if(a == b)
//   print("done");[/code]
//
// text containing [noparse] [brackets][/noparse]
//
// -----------------------------------------------------------------------
var opentags;           // open tag stack
var crlf2br = true;     // convert CRLF to <br>?
var noparse = false;    // ignore BBCode tags?
var urlstart = -1;      // beginning of the URL if zero or greater (ignored if -1)

// aceptable BBcode tags, optionally prefixed with a slash
var tagname_re = /^\/?(?:b|i|u|pre|samp|code|colou?r|size|noparse|url|img|s|q|blockquote)$/;

// color names or hex color
var color_re = /^(:?black|silver|gray|white|maroon|red|purple|fuchsia|green|lime|olive|yellow|navy|blue|teal|aqua|#(?:[0-9a-f]{3})?[0-9a-f]{3})$/i;

// numbers
var number_re = /^[\\.0-9]{1,8}$/i;

// reserved, unreserved, escaped and alpha-numeric [RFC2396]
var uri_re = /^[-;\/\?:@&=\+\$,_\.!~\*'\(\)%0-9a-z]{1,512}$/i;

// main regular expression: CRLF, [tag=option], [tag] or [/tag]
var postfmt_re = /([\r\n])|(?:\[([a-z]{1,16})(?:=([^\x00-\x1F"'\(\)<>\[\]]{1,256}))?\])|(?:\[\/([a-z]{1,16})\])/ig;

// stack frame object
function taginfo_t(bbtag, etag)
{
  this.bbtag = bbtag;
  this.etag = etag;
}

// check if it's a valid BBCode tag
function isValidTag(str)
{
  if(!str || !str.length)
    return false;

  return tagname_re.test(str);
}

//
// m1 - CR or LF
// m2 - the tag of the [tag=option] expression
// m3 - the option of the [tag=option] expression
// m4 - the end tag of the [/tag] expression
//
function textToHtmlCB(mstr, m1, m2, m3, m4, offset, string)
{
  //
  // CR LF sequences
  //
  if(m1 && m1.length) {
    if(!crlf2br)
      return mstr;

    switch (m1) {
      case '\r':
        return "";
      case '\n':
        return "<br>";
    }
  }

  //
  // handle start tags
  //
  if(isValidTag(m2)) {
    // if in the noparse state, just echo the tag
    if(noparse)
      return "[" + m2 + "]";

    // ignore any tags if there's an open option-less [url] tag
    if(opentags.length && opentags[opentags.length-1].bbtag == "url" && urlstart >= 0)
      return "[" + m2 + "]";

    switch (m2) {
      case "code":
        opentags.push(new taginfo_t(m2, "</code></pre>"));
        crlf2br = false;
        return "<pre><code>";

      case "pre":
        opentags.push(new taginfo_t(m2, "</pre>"));
        crlf2br = false;
        return "<pre>";

      case "color":
      case "colour":
        if(!m3 || !color_re.test(m3))
          m3 = "inherit";
        opentags.push(new taginfo_t(m2, "</span>"));
        return "<span style=\"color: " + m3 + "\">";

      case "size":
        if(!m3 || !number_re.test(m3))
          m3 = "1";
        opentags.push(new taginfo_t(m2, "</span>"));
        return "<span style=\"font-size: " + Math.min(Math.max(m3, 0.7), 3) + "em\">";

      case "s":
        opentags.push(new taginfo_t(m2, "</span>"));
        return "<span style=\"text-decoration: line-through\">";

      case "noparse":
        noparse = true;
        return "";

      case "url":
        opentags.push(new taginfo_t(m2, "</a>"));

        // check if there's a valid option
        if(m3 && uri_re.test(m3)) {
          // if there is, output a complete start anchor tag
          urlstart = -1;
          return "<a href=\"" + m3 + "\">";
        }

        // otherwise, remember the URL offset
        urlstart = mstr.length + offset;

        // and treat the text following [url] as a URL
        return "<a href=\"";

      case "img": // Added by Getskär IT Innovation AB, 2012.
        opentags.push(new taginfo_t(m2, "\">"));

        var style = 'style="max-width: 100%;"';
        if (m3) {
          style = 'class="tiny-bbcode-img-' + m3 + '"';
        }

        return "<img " + style + " src=\"";

      case "q":
      case "blockquote":
        opentags.push(new taginfo_t(m2, "</" + m2 + ">"));
        return m3 && m3.length && uri_re.test(m3) ? "<" + m2 + " cite=\"" + m3 + "\">" : "<" + m2 + ">";

      default:
        // [samp], [b], [i] and [u] don't need special processing
        opentags.push(new taginfo_t(m2, "</" + m2 + ">"));
        return "<" + m2 + ">";

    }
  }

  //
  // process end tags
  //
  if(isValidTag(m4)) {
    if(noparse) {
      // if it's the closing noparse tag, flip the noparse state
      if(m4 == "noparse")  {
        noparse = false;
        return "";
      }

      // otherwise just output the original text
      return "[/" + m4 + "]";
    }

    // highlight mismatched end tags
    if(!opentags.length || opentags[opentags.length-1].bbtag != m4)
      return "<span style=\"color: red\">[/" + m4 + "]</span>";

    if(m4 == "url") {
      // if there was no option, use the content of the [url] tag
      if(urlstart > 0)
        return "\">" + string.substr(urlstart, offset-urlstart) + opentags.pop().etag;

      // otherwise just close the tag
      return opentags.pop().etag;
    }
    else if(m4 == "code" || m4 == "pre")
      crlf2br = true;

    // other tags require no special processing, just output the end tag
    return opentags.pop().etag;
  }

  return mstr;
}

//
// post must be HTML-encoded
//
export function parseBBCode(post)
{
  var result, endtags, tag;

  // convert CRLF to <br> by default
  crlf2br = true;

  // create a new array for open tags
  if(opentags == null || opentags.length)
    opentags = new Array(0);

  // run the text through main regular expression matcher
  result = post.replace(postfmt_re, textToHtmlCB);

  // reset noparse, if it was unbalanced
  if(noparse)
    noparse = false;

  // if there are any unbalanced tags, make sure to close them
  if(opentags.length) {
    endtags = new String();

    // if there's an open [url] at the top, close it
    if(opentags[opentags.length-1].bbtag == "url") {
      opentags.pop();
      endtags += "\">" + post.substr(urlstart, post.length-urlstart) + "</a>";
    }

    // close remaining open tags
    while(opentags.length)
      endtags += opentags.pop().etag;
  }

  return endtags ? result + endtags : result;
}
/*
 * END OF STONESTEPS CODE
 */
