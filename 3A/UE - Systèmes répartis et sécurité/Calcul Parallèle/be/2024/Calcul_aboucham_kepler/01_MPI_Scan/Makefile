MPICC=smpicc
CFLAGS=-g -O4

all: mpi_scan

clean:
	rm -rf *.o mpi_scan

%.o: %.c
	echo $@
	$(MPICC) -c -Wall -o $@ $< $(CFLAGS) $(INCLUDES)

mpi_scan: mpi_scan.o
	$(MPICC) -Dhave_mpi -o $@ $^ -lm
