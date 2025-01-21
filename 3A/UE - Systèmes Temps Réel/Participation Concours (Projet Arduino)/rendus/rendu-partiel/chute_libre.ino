#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

const int lampPin = 8; // Définir la broche de la lampe

void setup() {
    Wire.begin(); // Initialisation du bus I2C
    Serial.begin(9600); // Initialisation du port série
    mpu.initialize(); // Initialisation du MPU6050

    pinMode(lampPin, OUTPUT); // Configurer la broche de la lampe comme sortie
    digitalWrite(lampPin, LOW); // Éteindre la lampe au démarrage

    // Vérification de la connexion au capteur
    if (mpu.testConnection()) {
        Serial.println("MPU6050 prêt !");
    } else {
        Serial.println("Erreur : impossible de connecter le MPU6050.");
        while (1); // Boucle infinie en cas d'erreur
    }
}

void loop() {
    int16_t a_x, a_y, a_z;
    const float ACCEL_SENSITIVITY = 16384.0; // Sensibilité pour ±2g
    const float GRAVITY = 9.80665; // Accélération gravitationnelle en m/s²

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
        digitalWrite(lampPin, HIGH); // Allumer la lampe
        while (1); // Arrêter le programme
    }

    delay(50); // Petit délai pour éviter les surcharges
}
