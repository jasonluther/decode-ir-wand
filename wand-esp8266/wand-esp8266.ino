#include <IRremoteESP8266.h>

#define ESP8266_LED 5

int recvPin = 4;
IRrecv irrecv(recvPin);

void setup() {
  Serial.begin(9600);
  pinMode(ESP8266_LED, OUTPUT);
  irrecv.enableIRIn();
}

void dumpWandId (decode_results *results) {
  unsigned char result[7];
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
    for (int i = 1; i < 4; i++) {
      Serial.print(result[i], HEX);
      Serial.print(" ");
    }
    Serial.println("");
  }
}

void  loop() {
  decode_results  results;        // Somewhere to store the results
  if (irrecv.decode(&results)) {  // Grab an IR code
    dumpWandId(&results);           // Output the results as source code
    irrecv.resume();              // Prepare for the next value
  }
  yield();
}
