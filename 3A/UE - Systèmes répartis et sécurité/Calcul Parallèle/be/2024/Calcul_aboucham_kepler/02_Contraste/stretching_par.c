#include <stdio.h>
#include <stdlib.h>
#include "stretching_util.h"
#include <mpi.h>

#define M 255

int main(int argc, char* argv[]) {

    MPI_Init(&argc, &argv);

    // Get my rank
    int my_rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    const char* filename = "Maupiti.jpg";
    // pour ne pas etre affiché a chaque fois
    if (my_rank==0) {
        printf("Appuyez sur une touche...\n");
    }
    // Début chargement de l'image 
    // (en parallèle, seul le processus 0 fera cette action)
    
    int nblines, nbcolumns, nbpixels;
    int* pixels;
    if (my_rank == 0) {
        // récupération de la taille de l'image
        getImageDimensions(filename, &nblines, &nbcolumns);

        // nombre de pixels (en parallèle seul le processus 0 aura cette information)
        nbpixels = nblines * nbcolumns;

        // Allouer de la mémoire pour le tableau pixels
        pixels = (int*) malloc(nbpixels * sizeof(int));

        if (pixels == NULL) {
            printf("Erreur : allocation mémoire échouée.\n");
            exit(1);
        }

        // Remplir le tableau pixels
        fillPixels(filename, pixels, nblines, nbcolumns);
    }

    // Fin du chargement de l'image

    // Diffuser le nombre de pixels à tous les autres processus
    MPI_Bcast(&nbpixels, 1, MPI_INT, 0, MPI_COMM_WORLD);

    // nombre de pixel local
    int nbpixels_local = nbpixels / size;

    // Allouer de la mémoire pour le tableau pixels
    int* local_pixels = (int*) malloc(nbpixels_local * sizeof(int));

    // Distribution des sous_blocs de l'image
    MPI_Scatter(pixels, nbpixels_local, MPI_INT, local_pixels, nbpixels_local, MPI_INT, 0, MPI_COMM_WORLD);
    // Calcul du min et du max local des pixels
    
    int pix_min_local = local_pixels[0];
    int pix_max_local = local_pixels[0];
    for (int i = 1; i < nbpixels_local; i++) {
        if (local_pixels[i] < pix_min_local) pix_min_local = local_pixels[i];
        if (local_pixels[i] > pix_max_local) pix_max_local = local_pixels[i];
    }

    // Fin du calcul du min et du max
    // Réduire pour obtenir le min et le max global des pixels
    int pix_min, pix_max;
    MPI_Reduce(&pix_min_local, &pix_min, 1, MPI_INT, MPI_MIN, 0, MPI_COMM_WORLD);
    MPI_Reduce(&pix_max_local, &pix_max, 1, MPI_INT, MPI_MAX, 0, MPI_COMM_WORLD);

    // Calcul de alpha, le paramètre pour les fonctions f_*
    float alpha;
    if (my_rank==0) {
        alpha = 1 + (float)(pix_max - pix_min) / M;
        printf("%f", alpha);
    }

    // Diffuser le alpha (ca marche parfaitement :) )
    MPI_Bcast(&alpha, 1, MPI_FLOAT, 0, MPI_COMM_WORLD);

    // Étirement du contraste pour tous les pixels avec la méthode choisie
    // (en parallèle, processus pairs => f_one, processus impairs => f_two)
    
    if (my_rank % 2 == 0) {
        for (int i = 0; i < nbpixels_local; i++) {
            local_pixels[i] = f_one(local_pixels[i], alpha);
        }
    } else {
        for (int i = 0; i < nbpixels_local; i++) {
            local_pixels[i] = f_two(local_pixels[i], alpha);
        }
    }

    // Fin étirement

    // Rassemblement des sous_blocs de l'image
    MPI_Gather(local_pixels, nbpixels_local, MPI_INT, pixels, nbpixels_local, MPI_INT, 0, MPI_COMM_WORLD);

    // Sauvegarde de l'image (en parallèle seul le processus 0 effectuera cette action)
    if (my_rank == 0) {
        saveImage(pixels, nblines, nbcolumns, "image-grey2-stretched.png");
    }

    // Fin sauvegarde
    
    MPI_Finalize();

    return EXIT_SUCCESS;
}
