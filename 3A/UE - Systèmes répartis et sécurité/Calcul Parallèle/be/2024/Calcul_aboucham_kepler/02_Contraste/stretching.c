#include <stdio.h>
#include <stdlib.h>
#include "stretching_util.h"

#define M 255

int main() {

    const char* filename = "Maupiti.jpg";
    printf("Appuyez sur une touche...\n");

    // Début chargement de l'image 
    // (en parallèle, seul le processus 0 fera cette action)
    
    int nblines, nbcolumns;

    // récupération de la taille de l'image
    getImageDimensions(filename, &nblines, &nbcolumns);

    // nombre de pixels (en parallèle seul le processus 0 aura cette information)
    int nbpixels = nblines * nbcolumns;

    // Allouer de la mémoire pour le tableau pixels
    int* pixels = (int*) malloc(nbpixels * sizeof(int));

    if (pixels == NULL) {
        printf("Erreur : allocation mémoire échouée.\n");
        exit(1);
    }

    // Remplir le tableau pixels
    fillPixels(filename, pixels, nblines, nbcolumns);

    // Fin du chargement de l'image

    // Calcul du min et du max des pixels
    
    int pix_min = pixels[0];
    int pix_max = pixels[0];
    for (int i = 1; i < nbpixels; i++) {
        if (pixels[i] < pix_min) pix_min = pixels[i];
        if (pixels[i] > pix_max) pix_max = pixels[i];
    }

    // Fin du calcul du min et du max

    // Calcul de alpha, le paramètre pour les fonctions f_*
    float alpha = 1 + (float)(pix_max - pix_min) / M;

    // Étirement du contraste pour tous les pixels avec la méthode choisie
    // (en parallèle, processus pairs => f_one, processus impairs => f_two)
    
    for (int i = 0; i < nblines * nbcolumns; i++) {
        pixels[i] = f_one(pixels[i], alpha);
        // pixels[i] = f_two(pixels[i], alpha);
    }

    // Fin étirement

    // Sauvegarde de l'image (en parallèle seul le processus 0 effectuera cette action)

    printf("Appuyez sur une touche...\n");
    saveImage(pixels, nblines, nbcolumns, "image-grey2-stretched.png");

    free(pixels);

    // Fin sauvegarde
    
    return 0;
}
