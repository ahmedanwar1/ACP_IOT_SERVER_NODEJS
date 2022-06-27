/*
 * Virtuino MQTT getting started example
 * Broker: HiveMQ (Secure connection)
 * Supported boards: ESP8266 / ESP32 
 * Created by Ilias Lamprou
 * Jul 13 2021
 */

#ifdef ESP8266
 #include <ESP8266WiFi.h>  // Pins for board ESP8266 Wemos-NodeMCU
 #else
 #include <WiFi.h>  
#endif
 
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include<Servo.h>

//MQTT_VERSION = 5
#define MQTT_VERSION 5

//---- WiFi settings
const char* ssid = "";
const char* password = "";

//---- MQTT Broker settings
const char* mqtt_server = "aeca0cb085af472198734cd066d0d6a5.s1.eu.hivemq.cloud"; // replace with your broker url
const char* mqtt_username = "ahmedanwar";
const char* mqtt_password = "Bf0YgD9b7MXOE5Zk";
const int mqtt_port =8883;

String SPACE_ID = "6230e4050551177b1192d7cd";

unsigned long lastMillis = 0;
//servo variables
Servo servo;

const int trigPin = D5;
const int echoPin = D6;
long duration;
int distanceCm;

bool barrierIsOpened = false;

WiFiClientSecure espClient;   // for no secure connection use WiFiClient instead of WiFiClientSecure 
//WiFiClient espClient;
PubSubClient client(espClient);


/*
static const char *root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";
*/

//==========================================
void setup_wifi() {
  delay(10);
  Serial.print("\nConnecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());
  Serial.println("\nWiFi connected\nIP address: ");
  Serial.println(WiFi.localIP());
}


//=====================================
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";   // Create a random client ID
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");

//      client.subscribe(command1_topic);   // subscribe the topics here
      //client.subscribe(command2_topic);   // subscribe the topics here
      String requestTopic = "request/openbarrier/" + SPACE_ID;
      client.subscribe(requestTopic.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");   // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

//================================================ setup
//================================================
void setup() {
  Serial.begin(115200);
  while (!Serial) delay(1);
  setup_wifi();
//  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
servo.attach(4);
 servo.write(0);
  
 pinMode(trigPin, OUTPUT);
 pinMode(echoPin, INPUT);

  #ifdef ESP8266
    espClient.setInsecure();
  #else   // for the ESP32
    //espClient.setCACert(root_ca);      // enable this line and the the "certificate" code for secure connection
  #endif
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}


//================================================ loop
//================================================
void loop() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-";   // Create a random client ID
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      String requestTopic = "request/openbarrier/" + SPACE_ID;
      client.subscribe(requestTopic.c_str());
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");   // Wait 5 seconds before retrying
      delay(5000);
    }
  }
  client.loop();
  String JSON = "{\"_id\": \"" + SPACE_ID + "\", \"barrierIsOpened\": "+ (barrierIsOpened? "true" : "false") +", \"vacant\": " + (distanceCm > 20 ? "true" : "false") + " }"; 

  if(millis() - lastMillis > 1000) {
    lastMillis = millis();
    String topicSend = "parking/space/" + SPACE_ID;
    client.publish(topicSend.c_str(), JSON.c_str());
  } 

  ultraSonicReader();
  if(distanceCm > 20) {
    delay(2000);
    servo.write(0); // close barrier
    barrierIsOpened = false;
    delay(1000);
  }
  
  while(reserved) {
    if(barrierIsOpened) {
      ultraSonicReader();
      delay(10000);
      if(distanceCm < 20) { //car entered
        delay(2000);
        servo.write(0);
        barrierIsOpened = false;
        delay(1000);
      }
    }
    ultraSonicReader();
    if(paymentConfirmed) {
      servo.write(180);
      barrierIsOpened = true;
      delay(2000);
      reserved = false;
      paymentConfirmed = false;
      break;
    }
    delay(100);
  }
}

void ultraSonicReader () {
  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  Serial.println(distanceCm);
  delay(500);
}

void sendJSON() {  
  
}

//=======================================  
// This void is called every time we have a message from the broker

void callback(char* topic, byte* payload, unsigned int length) {
  String incommingMessage = "";
  for (int i = 0; i < length; i++) incommingMessage+=(char)payload[i];
  
  Serial.println("Message arrived ["+String(topic)+"]"+incommingMessage);

  if(incommingMessage == "open") {
    servo.write(180);
    barrierIsOpened = true;
    String responseTopic = "response/openbarrier/"+SPACE_ID;
    client.publish(responseTopic.c_str(), "{\"msg\": \"opend successfuly\"}");
  }
//  //--- check the incomming message
//    if( strcmp(topic,command1_topic) == 0){
//     if (incommingMessage.equals("1")) 
//     {
////      digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on 
//     }
//     else {
////      digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off 
//     }
//  }

   //  check for other commands
 /*  else  if( strcmp(topic,command2_topic) == 0){
     if (incommingMessage.equals("1")) {  } // do something else
  }
  */
}



//======================================= publising as strings
//void publishMessage(const char* topic, String payload , boolean retained){
//  client.publish(topic, (byte*) payload.c_str(), 10, true);
//  Serial.println("Message publised ["+String(topic)+"]: "+payload);
//}