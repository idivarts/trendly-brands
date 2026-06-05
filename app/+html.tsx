import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
                <ScrollViewStyleReset />

                {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
                <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
                {/* Neutralize the browser's autofill tint so filled inputs match empty ones. */}
                <style dangerouslySetInnerHTML={{ __html: autofillReset }} />
                {/* Add any additional <head> elements that you want globally available on web... */}
            </head>
            <body>{children}</body>
        </html>
    );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

// The browser paints autofilled inputs with its own (blue/yellow) background,
// which made some form fields look mismatched against empty ones. The long
// transition trick keeps each input's own background; text color is inherited
// from the field so it stays legible in both light and dark themes.
const autofillReset = `
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
select:-webkit-autofill {
  transition: background-color 600000s 0s, color 600000s 0s !important;
  -webkit-text-fill-color: inherit !important;
  caret-color: inherit;
}`;
