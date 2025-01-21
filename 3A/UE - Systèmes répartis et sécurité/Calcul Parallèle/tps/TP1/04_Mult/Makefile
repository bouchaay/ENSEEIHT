MPICC=smpicc
CFLAGS=-g -O4

all: MultAv

code_etu:
	./genere_fichiers_etu.sh
	mkdir -p 04_Mult
	mv MultAv_etu.c 04_Mult/MultAv.c
	cp -rf 04_Mult ../../Fournitures

clean:
	rm -rf *.o MultAv

cleanF:
	rm -rf *.o MultAv
	rm -f 04_Mult/*.c

%.o: %.c
	echo $@
	$(MPICC) -c -Wall -o $@ $< 

MultAv: MultAv.o
	$(MPICC) -o $@ $^ 

cinerama:
	mpicc -Dhave_mpi -o MultAv MultAv.c
