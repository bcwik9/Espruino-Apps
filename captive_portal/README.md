# WIFI Captive Portal
Example of starting a wifi access point (AP) to let a user enter wifi credentials for their personal network to let the device connect to the internet, without having to program the device directly (ie. non-technical users can set up wifi).

To use the module, do something like:
```
require('captive_portal_module').start(function(){
  // Code you run here will run after the user connects to Wifi
  console.log("Connected to wifi!");
});
```

If you're copying & pasting the module code directly, you need to add a `var exports = {};` to the top of the file, then run `exports.start` instead of `require('captive_portal_module').start()`.

Original sources:
- https://gist.github.com/MaBecker/ae9dade26b44524e076ca19f5fd72fab
- https://gist.githubusercontent.com/wilberforce/cc6025a535b8a4c7e2910d4ba7845f11
