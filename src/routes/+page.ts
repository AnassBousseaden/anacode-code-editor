// Monaco imports CSS inside its module graph (e.g. codicon.css), which
// Node can't evaluate during SSR. Disable SSR for this dev playground;
// real consumers must do the same on routes that mount the editor.
export const ssr = false;
