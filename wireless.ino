#include <SoftwareSerial.h>

const byte trigPin = 9;
const byte echoPin = 2;
const byte alertLedPin = 3;
const byte bluetoothRxPin = 10;
const byte bluetoothTxPin = 11;

const int FAULT_THRESHOLD_CM = 10;
const unsigned long measurementIntervalMs = 100;
const unsigned long echoTimeoutUs = 30000;

SoftwareSerial bluetooth(bluetoothRxPin, bluetoothTxPin);

volatile unsigned long echoRiseMicros = 0;
volatile unsigned long echoPulseWidthUs = 0;
volatile bool echoPulseComplete = false;

bool faultFlag = false;
bool lastReportedFaultFlag = false;
bool hasReportedState = false;
bool awaitingEcho = false;

unsigned long lastTriggerMs = 0;
unsigned long triggerStartedUs = 0;

void echoChangeISR() {
  if (digitalRead(echoPin) == HIGH) {
    echoRiseMicros = micros();
    return;
  }

  if (echoRiseMicros == 0) {
    return;
  }

  echoPulseWidthUs = micros() - echoRiseMicros;
  echoRiseMicros = 0;
  echoPulseComplete = true;
}

void triggerMeasurement() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  awaitingEcho = true;
  triggerStartedUs = micros();
  lastTriggerMs = millis();
}

void publishState(long distanceCm) {
  bluetooth.print("{\"status\":\"");
  bluetooth.print(faultFlag ? "FAULT" : "OK");
  bluetooth.print("\",\"distance_cm\":");
  bluetooth.print(distanceCm);
  bluetooth.println("}");
}

void updateFaultState(long distanceCm) {
  bool newFaultFlag = distanceCm > 0 && distanceCm < FAULT_THRESHOLD_CM;
  faultFlag = newFaultFlag;

  digitalWrite(alertLedPin, faultFlag ? HIGH : LOW);

  if (!hasReportedState || faultFlag != lastReportedFaultFlag) {
    publishState(distanceCm);
    lastReportedFaultFlag = faultFlag;
    hasReportedState = true;
  }
}

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(alertLedPin, OUTPUT);
  digitalWrite(alertLedPin, LOW);

  bluetooth.begin(9600);

  if (digitalPinToInterrupt(echoPin) == NOT_AN_INTERRUPT) {
    bluetooth.println("{\"error\":\"echoPin must be on an interrupt-capable pin\"}");
    while (true) {
      digitalWrite(alertLedPin, HIGH);
      delay(150);
      digitalWrite(alertLedPin, LOW);
      delay(150);
    }
  }

  attachInterrupt(digitalPinToInterrupt(echoPin), echoChangeISR, CHANGE);
  triggerMeasurement();
}

void loop() {
  if (echoPulseComplete) {
    unsigned long pulseWidthUs;

    noInterrupts();
    pulseWidthUs = echoPulseWidthUs;
    echoPulseComplete = false;
    interrupts();

    awaitingEcho = false;

    long distanceCm = pulseWidthUs * 0.034 / 2;
    updateFaultState(distanceCm);
  }

  if (awaitingEcho && (micros() - triggerStartedUs) > echoTimeoutUs) {
    awaitingEcho = false;
    updateFaultState(0);
  }

  if (!awaitingEcho && (millis() - lastTriggerMs) >= measurementIntervalMs) {
    triggerMeasurement();
  }
}