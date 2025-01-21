#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define couleur(param) printf("\033[%sm", param)

// fonction calculant le nombre de diviseurs d'un entier (1 exclu)
int primes(int n)
{
  int nb_divisors, i;

  nb_divisors = 1;
  for(i = 2; i <= n/2; i++){
    if(n%i == 0){
        //printf("%d divise %d\n", i, n);
        nb_divisors++;
    }
  }
  return nb_divisors;
}

int main(int argc, char *argv[])
{

    if (argc != 2)
    {
      couleur("31");
      printf("usage : diviseurs <borne sup>\n");
      couleur("30");
      return EXIT_FAILURE;
    }

    // plus grand entier considéré
    int n = atoi(argv[1]);
    // nombre ayant le plus de diviseurs et ce nombre max de diviseurs
    int nb_max, max;
    // variable de calcul
    int nb;

    max = 1;
    nb_max = 1;

    for(int i = 1; i <= n ; i++)
    {
       nb = primes(i);
       //printf("le nombre de diviseurs de %d est %d\n", i, nb);
       if(nb > max)
       {
        max = nb;
        nb_max = i;
       }
    }

    printf("\n%d est un le plus petit nombre inférieur à %d qui possède le plus de diviseurs (%d)\n", nb_max, n, max);
    
    return 0;
}