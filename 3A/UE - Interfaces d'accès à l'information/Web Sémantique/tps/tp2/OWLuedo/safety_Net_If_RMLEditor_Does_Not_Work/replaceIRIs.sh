count=1
for word in $(cat $2)
do
    word=${word%?}
    sed -i 's/:'$count' /:'$word' /g' $1
    count=$(echo $count+1 | bc)
done