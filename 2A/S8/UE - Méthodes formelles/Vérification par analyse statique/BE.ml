(* module containing typical values of the floating-point format
 * used, binary16, in order to simulate binary16 computations
 * with standard ocaml float values
 *)
module Bounds =
  struct
    let name = "b16"
    (* machine epsilon = smallest representable positive value *)
    let eps = 0.000000059604645
    (* largest representable values = interval [min, max] *)
    let max = 65504.
    let min = -. max
  end

(* *)
let name = "BE"

module Itv = Intervals_double

let base_type = Ast.RealT

(* no option *)
let parse_param _ = ()

let fprint_help fmt = Format.fprintf fmt "Le domaine par défaut. Mini float en intervalles"

(* To implement your own non relational abstract domain,
 * first give the type of its elements.
 * an abstract element is a tuple x=(isNan, isMInf, isPInf, interval)
 * where:
 * - isNan  tells whether NaN is present in gamma(x)
 * - isMInf tells whether -∞  is present in gamma(x)
 * - isPInf tells whether +∞  is present in gamma(x)
 * - interval is the interval of normal values in binary16 range
 *   present in gamma(x)
 *)
type t = bool * bool * bool * Itv.t
       
(* a printing function (useful for debuging), *)
let fprint ff = function
  | (isNan, isMInf, isPInf, itv) ->
     begin
       if isNan  then Format.fprintf ff "NaN ⊔ ";
       if isMInf then Format.fprintf ff "-∞ ⊔ ";
       if isPInf then Format.fprintf ff "+∞ ⊔ ";
       Itv.fprint ff itv
     end
        
(* the order of the lattice. *)
let order (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  match (isNan1, isMInf1, isPInf1, itv1), (isNan2, isMInf2, isPInf2, itv2) with
  | (true, _ , _ ,_), (false, _, _, _ )  -> false
  | (_, true , _ ,_), (_, false, _, _ )  -> false
  | (_, _ , true ,_), (_, _, false, _ )  -> false
  | (_, _, _, itv1), (_, _, _, itv2) -> Itv.order itv1 itv2

(* and infimums of the lattice. *)
let top = true, true, true, Itv.top
let bottom = false, false, false, Itv.bottom

let is_bottom x = x = bottom
  
(* All the functions below are safe overapproximations.
 * You can keep them as this in a first implementation,
 * then refine them only when you need it to improve
 * the precision of your analyses. *)

let join (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  ((isNan1 || isNan2), (isMInf1 || isMInf2), (isPInf1 || isPInf2), (Itv.join itv1 itv2))

let meet (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  ((isNan1 && isNan2), (isMInf1 && isMInf2), (isPInf1 && isPInf2), (Itv.meet itv1 itv2))

let widening (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  let itv_widened = Itv.widening itv1 itv2 in
  match itv_widened with
  | Itv(a, b) ->
      let isMInf = isMInf1 || isMInf2 || (a = None) in
      let isPInf = isPInf1 || isPInf2 || (b = None) in
      (isNan1 || isNan2, isMInf, isPInf, itv_widened)
  | Bot ->
      let isMInf = isMInf1 || isMInf2 in
      let isPInf = isPInf1 || isPInf2 in
      (isNan1 || isNan2, isMInf, isPInf, itv_widened)

let sem_itv n1 n2 =
  match Itv.sem_itv n1 n2 with
  | Itv(Some n1, Some n2) -> (false, (n1 < -65504.), (n2 > 65504.), Itv.sem_itv n1 n2)
  | Itv(None, Some n2) -> (false, true, (n2 > 65504.), Itv.sem_itv n1 n2)
  | Itv(Some n1, None) -> (false, (n1 < -65504.), true, Itv.sem_itv n1 n2)
  | Itv(None, None) -> (false, true, true, Itv.sem_itv n1 n2)
  | Bot -> bottom

let sem_plus (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  let isNan = isNan1 || isNan2 in
  let isMInf = isMInf1 || isMInf2 in
  let isPInf = isPInf1 || isPInf2 in
  let itv = Itv.sem_plus itv1 itv2 in
    (isNan, isMInf, isPInf, itv)
  
let sem_minus (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  let isNan = (not(isNan1 && isNan2) || (isNan1&& not(isNan2))) in
  let isMInf = not(isMInf1 && isMInf2) || (isMInf1&& not(isMInf2)) in
  let isPInf = not(isPInf1 && isPInf2) || (isPInf1 &&not(isPInf2)) in
  let itv = (Itv.sem_minus itv1 itv2) in
    (isNan, isMInf, isPInf, itv)
    
let sem_times (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  let isNan = isNan1 || isNan2 in
  let isMInf = (isMInf1 && isPInf2) || (isPInf1 && isMInf2) in
  let isPInf = (isMInf1 && isMInf2) || (isPInf1 && isPInf2) in
  let itv = Itv.sem_times itv1 itv2 in
    (isNan, isMInf, isPInf, itv)

let sem_div (isNan1, isMInf1, isPInf1, itv1) (isNan2, isMInf2, isPInf2, itv2) =
  let isNan = isNan1 || isNan2 || (isMInf1 && isPInf2) || (isPInf1 && isMInf2) || (isMInf1 && isMInf2) || (isPInf1 && isPInf2) in
  let isMInf = (isMInf1 && not(isPInf2)) in
  let isPInf = (isPInf1 && not(isMInf2)) in
  let itv = Itv.sem_div itv1 itv2 in
    (isNan, isMInf, isPInf, itv)

let sem_geq0 = function
  | t -> meet (false, false, true, Itv.sem_itv 0. 65504.) t

(* imprecise abstractions for trigonometric functions sine and cosine.
 * We have:
 * sin(Nan) = sin(+oo) = sin(-oo) = Nan
 * sin([a, b]) = [-1, 1]
 *)
let sem_sin (isNan1, isMInf1, isPInf1, itv1) =
  (isNan1 || isMInf1 || isPInf1, false, false, Itv.sem_itv (-. 1.) 1.)

let sem_cos = sem_sin

let sem_exp (isNan1, isMInf1, isPInf1, itv1) =
  (isNan1, false, isPInf1, Itv.sem_itv 0. 65504.)

let sem_ln (isNan1, isMInf1, isPInf1, itv1) =
  (isNan1 || isMInf1, true , isPInf1, Itv.sem_itv (-65504.) 65504.)

let sem_call funname arg_list =
  match funname, arg_list with
  | "sin", [x] -> sem_sin x
  | "cos", [x] -> sem_cos x
  | "exp", [x] -> sem_exp x
  | "ln", [x]  -> sem_ln x
  | _          -> top

let backsem_plus (isNanX, isMInfX, isPInfX, itvX) (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) =
  let (itvX, itvY) = Itv.backsem_plus itvX itvY itvR in
  let newX = sem_plus (isNanX, isMInfX, isPInfX, itvX) (isNanR, isMInfR, isPInfR, itvR) in
  let newY = sem_plus (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) in
  (newX, newY)

let backsem_minus (isNanX, isMInfX, isPInfX, itvX) (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) =
  let (itvX, itvY) = Itv.backsem_minus itvX itvY itvR in
  let newX = sem_minus (isNanX, isMInfX, isPInfX, itvX) (isNanR, isMInfR, isPInfR, itvR) in
  let newY = sem_minus (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) in
  (newX, newY)

let backsem_times (isNanX, isMInfX, isPInfX, itvX) (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) =
  let (itvX, itvY) = Itv.backsem_times itvX itvY itvR in
  let newX = sem_times (isNanX, isMInfX, isPInfX, itvX) (isNanR, isMInfR, isPInfR, itvR) in
  let newY = sem_times (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) in
  (newX, newY)

let backsem_div (isNanX, isMInfX, isPInfX, itvX) (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) =
  let (itvX, itvY) = Itv.backsem_div itvX itvY itvR in
  let newX = sem_div (isNanX, isMInfX, isPInfX, itvX) (isNanR, isMInfR, isPInfR, itvR) in
  let newY = sem_div (isNanY, isMInfY, isPInfY, itvY) (isNanR, isMInfR, isPInfR, itvR) in
  (newX, newY)
