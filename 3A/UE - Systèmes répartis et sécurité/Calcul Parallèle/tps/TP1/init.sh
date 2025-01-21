#!/bin/bash

# à modifier en indiquant où est installé simgrid sur votre ordinateur
SIMGRID=C:/MPI/simgrid-3.36

export PATH=${SIMGRID}/bin:${PATH}

alias Smpirun="smpirun -hostfile ${PWD}/archis/cluster_hostfile.txt -platform ${PWD}/archis/cluster_crossbar.xml"
