# Nom de l'exécutable séquentiel
TARGET_S = stretching

# Nom du fichiers sources séquentiels
SRC_S = stretching_util.c stretching.c

# Nom de l'exécutable parallèle
TARGET_P = stretching_par

# Nom du fichiers sources parallèles
SRC_P = stretching_util.c stretching_par.c


# Compilateur et options
CXX = g++
CXXFLAGS = -Wall -O2

MPICXX = smpicxx

# Drapeaux pour OpenCV
OPENCV_CFLAGS = $(shell pkg-config --cflags opencv4)
OPENCV_LIBS = $(shell pkg-config --libs opencv4)

all: $(TARGET_S) $(TARGET_P)

# Commande finale de compilation du code séquentiel
$(TARGET_S): $(SRC_S)
	$(CXX) $(CXXFLAGS) $(SRC_S) -o $(TARGET_S) $(OPENCV_CFLAGS) $(OPENCV_LIBS)

# Commande finale de compilation du code séquentiel
$(TARGET_P): $(SRC_P)
	$(MPICXX) $(CXXFLAGS) $(SRC_P) -o $(TARGET_P) $(OPENCV_CFLAGS) $(OPENCV_LIBS)

# Nettoyer les fichiers générés
clean:
	rm -f $(TARGET_S) $(TARGET_P) image-grey2-stretched.png
