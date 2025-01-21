MPICC=smpicc
CFLAGS=-g -O4
CC = gcc

all: diviseurs diviseurs_par

clean:
	rm -rf *.o diviseurs diviseurs_par diviseurs_par2

diviseurs: diviseurs.c
	$(CC) -Wall -o diviseurs diviseurs.c 

diviseurs_par: diviseurs_par.c
	$(MPICC) -Wall -o diviseurs_par diviseurs_par.c 

diviseurs_par2: diviseurs_par2.c
	$(MPICC) -Wall -o diviseurs_par2 diviseurs_par2.c 
