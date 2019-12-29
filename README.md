# Decoding MagiQuest IR Wands with lirc

**Update 2019**: others have done a much nicer job of decoding wand transmissions recently. See the *References* below. 

#### Requirements

 * [MagiQuest](http://www.magiquest.com) wand
 * Raspberry Pi (tested on Raspbian) with Perl
 * [lirc](http://www.lirc.org)
   * `$ apt-get install lirc`
   * Add `dtoverlay=lirc-rpi` to `/boot/config.txt' and reboot
 * [IR receiver module](https://www.sparkfun.com/products/10266) [connected to 3V3, GND, and GPIO pin 18](https://learn.adafruit.com/using-an-ir-remote-with-a-raspberry-pi-media-center/hardware)
   * Test with `$ mode2 -d /dev/lirc0`. You should see something like this when you wave the wand:

    ```text
    space 3034972
    pulse 270
    space 847
    pulse 253
    space 880
    pulse 278
    ...
    ```

#### Usage

`$ ./wand.pl`

Each time a wand ID is decoded successfully, it will print in this format:
`ID:xxxxxx` where xxxxxx is the wand ID in hex, like 
`ID:22b1f9`. 

#### How it works

See the references below for background information. This script is largely based on the work that other people did to figure out how the wands work. 

The script watches the output of `mode2 -d /dev/lirc0` and reads the *space*/*pulse* timing. 

The wand transmits 56 bits of information. Each bit has a duty cycle of about 1150 (in whatever units mode2 gives you), where the duty cycle is the total time of each *space* and *pulse* pair. 

A pulse that takes up under 1/3 of the duty cycle is translated to *0*, and a pulse that takes more than 1/3 of the duty cycle is *1*. 

As the wand's battery level goes down, the duty cycle seems to increase, so my first attempt that was based on static cutoffs stopped working after a while. 

In the resulting 7 bytes, I observed this format with two wands: **00 ID ID ID MO MO MO**

 * The first byte was always 0
 * The next 3 bytes are the ID of the wand
 * The last 3 bytes change and might be related to the motion of the wand (or mean something else entirely)

The format may actually be more complex, but this allows me to reliably identify my two wands. 

#### References

 * <http://devinhenkel.com/compelling/update-magiquest-wand-code/>
 * <https://github.com/patricknevindwyer/arduino-magiquest>
 * <http://openschemes.com/2013/02/27/mq-widget-pic12f508-controlled-magiquest-toy/>
 * <https://github.com/mpflaga/Arduino-IRremote>
 * <https://forum.sparkfun.com/viewtopic.php?t=19070>
 * <http://www.element14.com/community/people/ranman9086/blog/2015/02/07/first-try-using-the-magiquest-wand-with-an-arduino>

#### Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This work is placed into the public domain.
