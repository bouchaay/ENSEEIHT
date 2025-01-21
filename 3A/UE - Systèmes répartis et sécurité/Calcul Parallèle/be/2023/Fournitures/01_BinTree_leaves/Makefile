MPICC=smpicc
CFLAGS=-g -O4

all: bintree_leaves

clean:
	rm -rf *.o bintree_leaves

%.o: %.c
	echo $@
	$(MPICC) -c -Wall -o $@ $< 

bintree_leaves: bintree_leaves.o
	$(MPICC) -o $@ $^ 
