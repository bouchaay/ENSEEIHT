#include <opencv2/opencv.hpp>

using namespace cv;

// Première méthode pour étirer le contraste
int f_one(int x, float n);

// Deuxième méthode pour étirer le contraste
int f_two(int x, float n);

// Convertit une image en niveaux de gris
Mat rgb2gray(Mat img);

// Fonction pour obtenir les dimensions de l'image (affiche aussi l'image)
void getImageDimensions(const char* filename, int* nblines, int* nbcolumns);

// Fonction pour remplir le tableau pixels
void fillPixels(const char* filename, int* pixels, int nblines, int nbcolumns);

// Charge l'image depuis le disque, la convertit en niveaux de gris et l'affiche
int* readImage(const char* filename, int* nblines, int* nbcolumns);

// Sauvegarde l'image et l'affiche
void saveImage(int* pixels, int nblines, int nbcolumns, const char* filename);
