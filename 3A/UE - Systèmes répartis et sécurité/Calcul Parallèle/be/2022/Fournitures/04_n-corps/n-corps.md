# Exercice 4 : problème aux N-corps

Ce fichier fait partie du rendu évalué pour le BE de Calcul parallèle.

## Question 1

Déterminer quels calculs peuvent être parallélisés et quelles communications mettre en
place dans le code séquentiel suivant. Proposer une réécriture parallèle avec
transmission de messages de ce code.

```
variables : force[1,...,N], data[1,...,N]
for t in 1, nb_steps do
  for i in 1, N do
    force[i] = 0
    for j in 1, N do
      force[i] = force[i] + interaction(data[i], data[j])
    end for
  end for
  for i in 1, N do
    data[i] = update(data[i], force[i])
  end for
end for
```

### Réponse Q2

*TODO*

```
variables : force[1,...,N], data[1,...,N]
for t in 1, nb_steps do
  for i in 1, N do
    force[i] = 0
    for j in 1, N do
      force[i] = force[i] + interaction(data[i], data[j])
    end for
  end for
  for i in 1, N do
    data[i] = update(data[i], force[i])
  end for
end for
```

## Question 2

Proposer une version parallèle du code suivant.

```
variables : force[1,...,N], data[1,...,N]
for t in 1, nb_steps do
  for i in 1, N do
    force[i] = 0
  end for
  for i in 1, N do
    for j in 1, i-1 do
      f = interaction(data[i],data[j])
      force[i] = force[i] + f
      force[j] = force[j] - f
    end for
  end for
  for i in 1, N do
    data[i] = update(data[i], force[i])
  end for
end for
```

### Réponse Q2

*TODO*

```
variables : force[1,...,N], data[1,...,N]
for t in 1, nb_steps do
  for i in 1, N do
    force[i] = 0
  end for
  for i in 1, N do
    for j in 1, i-1 do
      f = interaction(data[i],data[j])
      force[i] = force[i] + f
      force[j] = force[j] - f
    end for
  end for
  for i in 1, N do
    data[i] = update(data[i], force[i])
  end for
end for
```

## Question 3

Quels sont les inconvénients de cette version ?
Proposer une solution pour les atténuer.

### Réponse Q3

*TODO*

