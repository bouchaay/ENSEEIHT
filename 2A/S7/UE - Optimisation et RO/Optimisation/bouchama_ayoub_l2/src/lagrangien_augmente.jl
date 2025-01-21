using LinearAlgebra
include("../src/newton.jl")
include("../src/regions_de_confiance.jl")
"""

Approximation d'une solution au problème 

    min f(x), x ∈ Rⁿ, sous la c c(x) = 0,

par l'algorithme du lagrangien augmenté.

# Syntaxe

    x_sol, f_sol, flag, nb_iters, μs, λs = lagrangien_augmente(f, gradf, hessf, c, gradc, hessc, x0; kwargs...)

# Entrées

    - f      : (Function) la ftion à minimiser
    - gradf  : (Function) le gradient de f
    - hessf  : (Function) la hessienne de f
    - c      : (Function) la c à valeur dans R
    - gradc  : (Function) le gradient de c
    - hessc  : (Function) la hessienne de c
    - x0     : (Vector{<:Real}) itéré initial
    - kwargs : les options sous formes d'arguments "keywords"
        • max_iter  : (Integer) le nombre maximal d'iterations (optionnel, par défaut 1000)
        • tol_abs   : (Real) la tolérence absolue (optionnel, par défaut 1e-10)
        • tol_rel   : (Real) la tolérence relative (optionnel, par défaut 1e-8)
        • λ0        : (Real) le μltiplicateur de lagrange associé à c initial (optionnel, par défaut 2)
        • μ0        : (Real) le facteur initial de pénalité de la c (optionnel, par défaut 10)
        • τ         : (Real) le facteur d'accroissement de μ (optionnel, par défaut 2)
        • algo_noc  : (String) l'algorithme sans c à utiliser (optionnel, par défaut "rc-gct")
            * "newton"    : pour l'algorithme de Newton
            * "rc-cauchy" : pour les régions de confiance avec pas de Cauchy
            * "rc-gct"    : pour les régions de confiance avec gradient conjugué tronqué

# Sorties

    - x_sol    : (Vector{<:Real}) une approximation de la solution du problème
    - f_sol    : (Real) f(x_sol)
    - flag     : (Integer) indique le critère sur lequel le programme s'est arrêté
        • 0 : convergence
        • 1 : nombre maximal d'itération dépassé
    - nb_iters : (Integer) le nombre d'itérations faites par le programme
    - μs       : (Vector{<:Real}) tableau des valeurs prises par μk au cours de l'exécution
    - λs       : (Vector{<:Real}) tableau des valeurs prises par λk au cours de l'exécution

# Exemple d'appel

    f(x)=100*(x[2]-x[1]^2)^2+(1-x[1])^2
    gradf(x)=[-400*x[1]*(x[2]-x[1]^2)-2*(1-x[1]) ; 200*(x[2]-x[1]^2)]
    hessf(x)=[-400*(x[2]-3*x[1]^2)+2  -400*x[1];-400*x[1]  200]
    c(x) =  x[1]^2 + x[2]^2 - 1.5
    gradc(x) = 2*x
    hessc(x) = [2 0; 0 2]
    x0 = [1; 0]
    x_sol, _ = lagrangien_augmente(f, gradf, hessf, c, gradc, hessc, x0, algo_noc="rc-gct")

"""
function lagrangien_augmente(f::Function, gradf::Function, hessf::Function, 
        c::Function, gradc::Function, hessc::Function, x0::Vector{<:Real}; 
        max_iter::Integer=1000, tol_abs::Real=1e-10, tol_rel::Real=1e-8,
        λ0::Real=2, μ0::Real=10, τ::Real=2, algo_noc::String="rc-gct")

        # Les constantes
        β = 0.9
        η = 0.1258925
        α = 0.1
        ε0 = 1/μ0
        η0 = η/(μ0^α)
        ηk = η0
        εk = ε0

        # Initialisation
        x_sol = x0
        f_sol = f(x_sol)
        flag  = -1
        nb_iters = 0
        μs = [μ0] # vous pouvez faire μs = vcat(μs, μk) pour concaténer les valeurs
        λs = [λ0]
        μk = μ0
        λk = λ0

        # Les fonctions utilisées
        function Laf(xf, λf, μf)
            return f(xf) + λf'*c(xf) + (μf/2)*norm(c(xf))^2
        end
        function gradLaf(xf, λf, μf)
            return gradf(xf) + (λf'*gradc(xf)) + μf*gradc(xf)*c(xf)
        end
        function hessLaf(xf, λf, μf)
            return hessf(xf) + (λf'*hessc(xf)) + μf*(hessc(xf)*c(xf) + gradc(xf)*gradc(xf)')
        end

        # Fonction Lagrangien Augmenté
        La(x) = Laf(x, λk, μk)
        gradLa(x) = gradLaf(x, λk, μk)
        hessLa(x) = hessLaf(x, λk, μk)
    
        # Boucler tant que le critère d'arrêt n'est pas satisfait
        while flag == -1
    
            # Minimiser le problème
            while norm(gradLa(x_sol)) > εk
                if algo_noc == "newton"
                    x_sol,_,_,_,_ = newton(La, gradLa, hessLa, x_sol)
                elseif algo_noc == "rc-cauchy"
                    x_sol,_,_,_,_ = regions_de_confiance(La, gradLa, hessLa, x_sol, algo_pas="cauchy")
                elseif algo_noc == "rc-gct"
                    x_sol,_,_,_,_ = regions_de_confiance(La, gradLa, hessLa, x_sol, algo_pas="gct")
                else
                    error("Algorithme non reconnu")
                end
            end
            # Mettre à jour les multiplicateurs de Lagrange
            if norm(c(x_sol)) <= ηk
                λk += μk*c(x_sol)
                εk = εk/μk
                ηk = ηk/(μk^β)

            # Mettre à jour le facteur de pénalité
            else
                μk = μk*τ
                εk = ε0/μk
                ηk = η/(μk^α)
            end
            
            # Mettre à jour les tableaux des valeurs de μ et λ
            μs = vcat(μs, μk)
            λs = vcat(λs, λk)

            # Mise a jour du nombre d'itérations
            nb_iters = nb_iters + 1
            
            # Test de convergence
            if (norm(gradLaf(x_sol, λk, 0)) <= max(tol_rel * norm(gradLaf(x0, λ0, 0)), tol_abs)) && (norm(c(x_sol)) <= max(tol_rel * norm(c(x0)), tol_abs))
                flag = 0
            
            # Test de convergence sur les contraintes
            elseif norm(c(x_sol)) <= max(tol_rel * norm(c(x0)), tol_abs)
                flag = 1

            # Test de non convergence
            elseif nb_iters >= max_iter
                flag = 3
            end
        end
    
        return x_sol, f_sol, flag, nb_iters, μs, λs
    
    end