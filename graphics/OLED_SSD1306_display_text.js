function start(){
  //g.setFontVector(20); // set font size
  g.drawString("Hello",0,0);
  g.flip(); // write to screen
}

// I2C
var sda_pin = NodeMCU.D1;
var scl_pin = NodeMCU.D2;
I2C1.setup({scl: scl_pin, sda: sda_pin});
var g = require("SSD1306").connect(I2C1, start);