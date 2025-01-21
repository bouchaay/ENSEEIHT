#include <Wire.h>
#include <MPU6050.h>
#include <Servo.h> // Bibliothèque pour le contrôle des servomoteurs

MPU6050 mpu;
Servo servos[3]; // Tableau pour stocker les instances des servomoteurs

const int servoPins[] = {9, 11}; // Broches des servomoteurs
const int pinCount = sizeof(servoPins) / sizeof(servoPins[0]); // Nombre de servomoteurs

// Fonction pour contrôler tous les servomoteurs simultanément
void controlServos(Servo servos[], int pinCount) {
  // Déplacer tous les servomoteurs à 90°
  for (int i = 0; i < pinCount; i++) {
    servos[i].write(0);
  }
  delay(10000);        // Maintenir la position pendant 1 seconde
  
  // Retourner tous les servomoteurs à la position initiale (0°)
  for (int i = 0; i < pinCount; i++) {
    servos[i].write(90);
  }
  delay(1000);        // Pause pour stabilisation
}

void setup() {
  Wire.begin();           // Initialisation du bus I2C
  Serial.begin(9600);     // Initialisation du port série
  mpu.initialize();       // Initialisation du MPU6050

  // Vérification de la connexion au capteur
  if (mpu.testConnection()) {
    Serial.println("MPU6050 prêt !");
  } else {
    Serial.println("Erreur : impossible de connecter le MPU6050.");
    while (1); // Boucle infinie en cas d'erreur
  }

  // Initialisation des servomoteurs
  for (int i = 0; i < pinCount; i++) {
    servos[i].attach(servoPins[i]); // Attacher chaque servomoteur à sa broche
    servos[i].write(90);             // Position initiale des servomoteurs
  }
}

void loop() {
  int16_t a_x, a_y, a_z;
  const float ACCEL_SENSITIVITY = 16384.0; // Sensibilité pour ±2g
  const float GRAVITY = 9.80665;           // Accélération gravitationnelle en m/s²

  // Lecture des valeurs d'accélération
  mpu.getAcceleration(&a_x, &a_y, &a_z);
  float ax = a_x * GRAVITY / ACCEL_SENSITIVITY;
  float ay = a_y * GRAVITY / ACCEL_SENSITIVITY;
  float az = a_z * GRAVITY / ACCEL_SENSITIVITY;

  // Afficher les valeurs sur le moniteur série
  Serial.print("X:"); Serial.print(ax); Serial.print(" ");
  Serial.print("Y:"); Serial.print(ay); Serial.print(" ");
  Serial.print("Z:"); Serial.println(az);

  // Détection de chute libre
  if (az <= 0) {
    Serial.println("Chute libre détectée !");
    controlServos(servos, pinCount); // Contrôler tous les servomoteurs simultanément
  }

  delay(50); // Petit délai pour éviter les surcharges
}
