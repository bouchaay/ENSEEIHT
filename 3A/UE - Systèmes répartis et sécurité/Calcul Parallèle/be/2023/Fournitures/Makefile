SOURCES=01_BinTree_leaves 02_Diviseurs 03_Equilibrage

all: collect


collect:
	echo ${USER}
	(cd 01_BinTree_leaves; make clean)
	(cd 02_Diviseurs; make clean)
	tar cvf Calcul_${USER}_`hostname | cut -d'.' -f1`.tar ${SOURCES}
