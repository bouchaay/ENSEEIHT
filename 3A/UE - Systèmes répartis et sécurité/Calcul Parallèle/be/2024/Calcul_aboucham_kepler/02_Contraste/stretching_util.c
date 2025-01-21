#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <opencv2/opencv.hpp>

#define M 255

using namespace cv;

// Première méthode pour étirer le contraste
int f_one(int x, float n) {
    if (x == 0) return 0;
    return (int)(pow(M, 1 - n) * pow(x, n));
}

// Deuxième méthode pour étirer le contraste
int f_two(int x, float n) {
    if (x == 0) return 0;
    return (int)(pow(M, (n - 1) / n) * pow(x, 1 / n));
}

// Convertit une image en niveaux de gris
Mat rgb2gray(Mat img) {
    Mat gray;
    cvtColor(img, gray, COLOR_BGR2GRAY);
    return gray;
}

// Fonction pour obtenir les dimensions de l'image
void getImageDimensions(const char* filename, int* nblines, int* nbcolumns) {
    Mat img = imread(filename);
    if (img.empty()) {
        printf("Erreur : impossible de charger l'image.\n");
        exit(1);
    }

    imshow("Image Originale", img);
    waitKey(0);

    Mat grey;
    cvtColor(img, grey, COLOR_BGR2GRAY);

    *nblines = grey.rows;
    *nbcolumns = grey.cols;
}

// Fonction pour remplir le tableau pixels
void fillPixels(const char* filename, int* pixels, int nblines, int nbcolumns) {
    Mat img = imread(filename);
    if (img.empty()) {
        printf("Erreur : impossible de charger l'image.\n");
        exit(1);
    }

    Mat grey;
    cvtColor(img, grey, COLOR_BGR2GRAY);

    for (int i = 0; i < nblines; i++) {
        for (int j = 0; j < nbcolumns; j++) {
            pixels[i * nbcolumns + j] = grey.at<uchar>(i, j);
        }
    }
}

// Charge l'image depuis le disque, la convertit en niveaux de gris et l'affiche
int* readImage(const char* filename, int* nblines, int* nbcolumns) {
    Mat img = imread(filename);
    if (img.empty()) {
        printf("Erreur : impossible de charger l'image.\n");
        exit(1);
    }
    imshow("Image Originale", img);
    waitKey(0);

    Mat grey = rgb2gray(img);
    *nblines = grey.rows;
    *nbcolumns = grey.cols;

    int* pixels = (int*) malloc((*nblines) * (*nbcolumns) * sizeof(int));

    for (int i = 0; i < *nblines; i++) {
        for (int j = 0; j < *nbcolumns; j++) {
            pixels[i * (*nbcolumns) + j] = grey.at<uchar>(i, j);
        }
    }
    return pixels;
}

// Sauvegarde l'image et l'affiche
void saveImage(int* pixels, int nblines, int nbcolumns, const char* filename) {
    Mat newImg(nblines, nbcolumns, CV_8UC1);
    for (int i = 0; i < nblines; i++) {
        for (int j = 0; j < nbcolumns; j++) {
            newImg.at<uchar>(i, j) = (uchar)pixels[i * nbcolumns + j];
        }
    }
    imshow("Image étirée", newImg);
    waitKey(0);
    imwrite(filename, newImg);
}
