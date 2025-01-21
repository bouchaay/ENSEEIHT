// N nombre de pixels de l'image
int N = get_image_size(filename);

// allocation de la mémoire pour contenir l'image 
// variable pixels : tableau de 3*N octets (3 octets par pixels, RVB)
char *pixels = allocate_image(N);

// lecture de l'image
read_image(pixels, N, filename);

// tableau lumi contenant la luminance de chaque pixel
// (valeur entre 0 et 255 => tableau d'entiers de taille N)
int *lumi = allocate_lumi(N);

// calcul de la luminance -> complexité : 1 calcul par pixel
compute_luminance(lumi, pixels, N);

// tableau histo de taille 256 qui compte le nombre de pixels 
// ayant la luminance correspondante
int *histo = allocate_histo(256);

// calcul de l'histogramme -> complexité : 1 calcul par pixel
compute_histo(histo, lumi, N);

// Équilibrage de l'image d'origine en utilisant l'histogramme : 
// on crée une nouvelle image -> complexité : 1 calcul par pixel 
// (calcul faisant intervenir la valeur du pixel et l'histogramme 
// de l'image complète) ;
// la saturation (nombre de pixels ayant la valeur 0 ou la valeur 255)
// est aussi calculée
char *new_pixels = allocate_image(N);
int saturation;

equalize(new_pixels, &saturation, pixels, histo, N);

// sauvegarde de l'image égalisée
save_image(new_pixels, N, filename2);

// affichage de la saturation
printf("la saturation est de %d\n", saturation)
