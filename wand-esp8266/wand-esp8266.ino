#include <IRremoteESP8266.h>

#define ESP8266_LED 5

union WandID {
 uint32_t integer;
 unsigned char byte_array[4];
};

int recvPin = 4;
IRrecv irrecv(recvPin);

void setup() {
  Serial.begin(9600);
  pinMode(ESP8266_LED, OUTPUT);
  irrecv.enableIRIn();
}

uint32_t getIntWandId (decode_results *results) {
  unsigned char result[7];
  WandID wid;
  int result_i = 0;
  unsigned char current_byte;
  if (results->rawlen == 112) { /* RAWBUF should be > 112 in .h file */
    Serial.print("Wand: ");
    for (int i = 1;  i < results->rawlen;  i+= 2) {
      int pulse = results->rawbuf[i];
      int space = results->rawbuf[i+1];
      byte bit = ((float)pulse / ((float)pulse + (float)space)) > 0.40 ? 1 : 0;
      result_i = (i-1) / 16;
      if ((i-1) % 16 == 0) {
        result[result_i] = 0;
      }
      result[result_i] |= bit << (7 - (((i-1) % 16)/2));
    }
    for (int i = 0; i < 4; i++) {
      Serial.print(result[i], HEX);
      Serial.print(" ");
      wid.byte_array[i] = result[3-i]; // little endian
    }
    Serial.println(wid.integer, DEC);
    return wid.integer;
  }
  return 0;
}

void  loop() {
  decode_results results;
  if (irrecv.decode(&results)) {
    uint32_t wand_integer = getIntWandId(&results);
    if (wand_integer) {
      // do something interesting
      Serial.println("Doing something interesting");
    }
    irrecv.resume();
  }
  yield();
}
