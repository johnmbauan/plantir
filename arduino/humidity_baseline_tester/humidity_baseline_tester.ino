/*
 * Lettura Sensore Umidità Terreno Capacitivo v1.2
 */

// Pin a cui è collegato il cavo "AUOUT" o "SIG" del sensore
const int sensorPin = A0; 

// Valori di calibrazione (modificali dopo i tuoi test)
const int AirValue = 590;   // Valore letto con sensore all'asciutto
const int WaterValue = 280; // Valore letto con sensore immerso in acqua

void setup() {
  Serial.begin(9600); // Inizia la comunicazione seriale
  pinMode(sensorPin, INPUT);
}

void loop() {
  // Legge il valore analogico grezzo
  int rawValue = analogRead(sensorPin);

  // Mappa il valore in una percentuale (0% - 100%)
  // Usiamo map(valore, minimo, massimo, uscita_min, uscita_max)
  int soilMoisturePercent = map(rawValue, AirValue, WaterValue, 0, 100);

  // Limita i valori tra 0 e 100 per evitare letture errate fuori scala
  if(soilMoisturePercent > 100) soilMoisturePercent = 100;
  if(soilMoisturePercent < 0) soilMoisturePercent = 0;

  // Stampa i risultati sul Monitor Seriale
  Serial.print("Grezzo: ");
  Serial.print(rawValue);
  Serial.print(" | Umidità: ");
  Serial.print(soilMoisturePercent);
  Serial.println("%");

  delay(1000); // Attende un secondo tra le letture
}