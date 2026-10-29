# The print as a development plugin

For a seat where the Figma MCP server is not available. The plugin is the generated script
in a manifest; nothing else.

`code.js` is the generated print, committed so no Node run is needed on the machine with
the file; `code.mcp.js` is the same print in the form the Figma MCP server's script runner
takes. Both bind variables by name, so neither depends on the seed. To regenerate after a
map change:

```
npm run -s figma:print > scripts/figma/plugin/code.js
npm run -s figma:print:mcp > scripts/figma/plugin/code.mcp.js
```

(`-s` keeps npm's own echo out of the file.)

In the Figma desktop app: Plugins, Development, Import plugin from manifest, and pick
`scripts/figma/plugin/manifest.json`. Run it in the file where okchroma's extended plugin
has written the variables. The plugin closes with a summary of what it created, updated,
skipped and could not find.

`plugin-paths.json`, one directory up, is a dump of every variable path the extended plugin
writes for one brand, its payload builders' output plus the four surface planes. The
generator holds every path it binds against that list and stops on one the plugin does not
write, so a renamed or zoned path is caught here and never as a run that binds nothing.
