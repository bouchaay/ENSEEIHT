SOURCES=02_Limite 01_Ring 03_Dot 04_Mult 05_CG

all: collect


collect:
	echo ${USER}
	(cd 01_Ring; make clean)
	(cd 02_Limite; make clean)
	(cd 03_Dot; make clean)
	(cd 04_Mult; make clean)
	(cd 05_CG; make clean)
	tar cvf Calcul_${USER}_`hostname | cut -d'.' -f1`.tar ${SOURCES}

