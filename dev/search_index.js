var documenterSearchIndex = {"docs":
[{"location":"reference/#Reference-1","page":"Reference","title":"Reference","text":"","category":"section"},{"location":"reference/#Computing-flame-graphs-1","page":"Reference","title":"Computing flame graphs","text":"","category":"section"},{"location":"reference/#","page":"Reference","title":"Reference","text":"flamegraph\nFlameGraphs.NodeData","category":"page"},{"location":"reference/#FlameGraphs.flamegraph","page":"Reference","title":"FlameGraphs.flamegraph","text":"g = flamegraph(data=Profile.fetch(); lidict=nothing, C=false, combine=true, recur=:off, pruned=[])\n\nCompute a graph representing profiling data. To compute it for the currently-collected profiling information, omit both data and lidict; if you are computing it for saved profiling data, supply both. (data and lidict must be a matched pair from Profile.retrieve().)\n\nYou can control the strategy with the following keywords:\n\nC: if true, include stackframes collected from ccalled code.\ncombine: if true, instruction pointers that correspond to the same line of code are combined into a single stackframe\npruned: a list of (funcname, filename) pairs that trigger the termination of this branch of the flame graph. You can use this to prevent very \"tall\" graphs from deeply-recursive calls, e.g., pruned = [(\"sort!\", \"sort.jl\")] would omit nodes corresponding to Julia's sort! function and anything called by it. See also recur for an alternative strategy.\nrecur (supported on Julia 1.4+): represent recursive calls as if they corresponded to iteration.\n\ng can be inspected using AbstractTrees.jl's print_tree.\n\n\n\n\n\n","category":"function"},{"location":"reference/#FlameGraphs.NodeData","page":"Reference","title":"FlameGraphs.NodeData","text":"data = NodeData(sf::StackFrame, status::UInt8, span::UnitRange{Int})\n\nData associated with a single node in a flamegraph. sf is the stack frame (see ?StackTraces.StackFrame). status is a bitfield with information about this node or any \"suppressed\" nodes immediately called by this one:\n\nstatus & 0x01 is nonzero for runtime dispatch\nstatus & 0x02 is nonzero for garbage collection\n\nBy default, C-language stackframes are omitted, but information about their identity is accumulated into their caller's status.\n\nlength(span) is the number of times this stackframe was captured at this depth and location in the flame graph. The starting index begins with the caller's starting span but increments to ensure each child's span occupies a distinct subset of the caller's span. Concretely, span is the range of indexes that will be occupied by this stackframe when the flame graph is rendered.\n\n\n\n\n\n","category":"type"},{"location":"reference/#Rendering-flame-graphs-1","page":"Reference","title":"Rendering flame graphs","text":"","category":"section"},{"location":"reference/#","page":"Reference","title":"Reference","text":"flamepixels\nflametags\nFlameColors\nStackFrameCategory\nFlameGraphs.default_modcat\nFlameGraphs.default_loccat","category":"page"},{"location":"reference/#FlameGraphs.flamepixels","page":"Reference","title":"FlameGraphs.flamepixels","text":"img = flamepixels(g; kwargs...)\n\nReturn a flamegraph as a matrix of RGB colors. The first dimension corresponds to cost, the second dimension to depth in the call stack.\n\nSee also flametags.\n\n\n\n\n\nimg = flamepixels(fcolor, g; costscale=nothing)\n\nReturn a flamegraph as a matrix of RGB colors, customizing the color choices.\n\nfcolor\n\nfcolor is a function that returns the color used for the current item in the call stack. See FlameColors for the default implementation of fcolor.\n\nIf you provide a custom fcolor, it must support the following API:\n\ncolorbg = fcolor(:bg)\ncolorfont = fcolor(:font)\n\nmust return the background and font colors.\n\ncolornode = fcolor(nextidx::Vector{Int}, j, data::NodeData)\n\nchooses the color for the node represented by data (see NodeData). j corresponds to depth in the call stack and nextidx[j] holds the state for the next color choice. In general, if you have a list of colors, fcolor should cycle nextidx[j] to ensure that the next call to fcolor with this j moves on to the next color. (However, you may not want to increment nextidx[j] if you are choosing the color by some means other than cycling through a list.)\n\nBy accessing data.sf, you can choose to color individual nodes based on the identity of the stackframe.\n\ncostscale\n\ncostscale can be used to limit the size of img when profiling collected a large number of stacktraces. The size of the first dimension of img is proportional to the total number of stacktraces collected during profiling. costscale is the constant of proportionality; for example, setting costscale=0.2 would mean that size(img, 1) would be approximately 1/5 the number of stacktraces collected by the profiler. The default value of nothing imposes an upper bound of approximately 1000 pixels along the first dimension, with costscale=1 chosen if the number of samples is less than 1000.\n\n\n\n\n\n","category":"function"},{"location":"reference/#FlameGraphs.flametags","page":"Reference","title":"FlameGraphs.flametags","text":"tagimg = flametags(g, img)\n\nFrom a flame graph g, generate an array tagimg with the same axes as img, encoding the stackframe represented by each pixel of img.\n\nSee flamepixels to generate img.\n\n\n\n\n\n","category":"function"},{"location":"reference/#FlameGraphs.FlameColors","page":"Reference","title":"FlameGraphs.FlameColors","text":"fcolor = FlameColors(n::Integer; colorbg=colorant\"white\", colorfont=colorant\"black\", colorrt=colorant\"red\", colorgc=colorant\"orange\")\n\nChoose a set of colors for rendering a flame graph. There are several special colors:\n\ncolorbg is the background color\ncolorfont is used when annotating stackframes with text\ncolorrt highlights runtime dispatch, typically a costly process\ncolorgc highlights garbage-collection events\n\nn specifies the number of \"other\" colors to choose when one of the above is not relevant. FlameColors chooses two lists of length n, one for even depths in the stacktrace and the other for odd depths in the stacktrace. Consequently, different stackframes will typically be distinguishable from one another by color.\n\nWhile the return value is a struct, it is callable and can be used as the fcolor input for flamepixels and flamesvg.\n\n\n\n\n\n","category":"type"},{"location":"reference/#FlameGraphs.StackFrameCategory","page":"Reference","title":"FlameGraphs.StackFrameCategory","text":"StackFrameCategory(modcat=FlameGraphs.default_modcat,\n                   loccat=FlameGraphs.default_loccat,\n                   colorbg=colorant\"white\",\n                   colorfont=colorant\"black\")\n\nColorize stackframes based on their category.\n\nmodcat(mod::Module) should return a color based on the stackframe's module, or nothing if it cannot categorize the stack frame based on the module.\n\nloccat(sf::StackFrame) must return a color. It can use any of the fields of the stackframe, but func, file, line, and from_c might be common choices.\n\ncolorbg is the background color, and colorfont stores the choice of font color.\n\nExamples\n\nusing Plots, Profile, FlameGraphs\n@profile plot(rand(5))    # \"time to first plot\"\ng = flamegraph(C=true)\nimg = flamepixels(StackFrameCategory(), g)\n\nOr you can tweak the coloration yourself:\n\nfunction modcat(mod)\n    mod == Plots && return colorant\"purple\"\n    return nothing\nend\nimg = flamepixels(StackFrameCategory(modcat), g)\n\n\n\n\n\n","category":"type"},{"location":"reference/#FlameGraphs.default_modcat","page":"Reference","title":"FlameGraphs.default_modcat","text":"default_modcat(mod::Module)\n\nReturns dark gray for Core.Compiler, light gray for Core, light blue for Base, and otherwise returns nothing.\n\n\n\n\n\n","category":"function"},{"location":"reference/#FlameGraphs.default_loccat","page":"Reference","title":"FlameGraphs.default_loccat","text":"default_loccat(sf::StackFrame)\n\nReturns yellow for LLVM, orange for any other ccall, dark gray for anything in ./compiler, light blue for Base code, and red for anything else.\n\n\n\n\n\n","category":"function"},{"location":"#FlameGraphs.jl-1","page":"Home","title":"FlameGraphs.jl","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"FlameGraphs is a package that adds functionality to Julia's Profile standard library. It is directed at the algorithmic side of producing flame graphs, but includes some \"format agnostic\" rendering code. FlameGraphs is used by visualization packages like ProfileView and ProfileSVG.","category":"page"},{"location":"#Computing-a-flame-graph-1","page":"Home","title":"Computing a flame graph","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"The core function of FlameGraphs is to compute a tree representation of a set of backtraces collected by Julia's sampling profiler. For a demonstration we'll use the following function:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"function profile_test(n)\n    for i = 1:n\n        A = randn(100,100,20)\n        m = maximum(A)\n        Am = mapslices(sum, A; dims=2)\n        B = A[:,:,5]\n        Bsort = mapslices(sort, B; dims=1)\n        b = rand(100)\n        C = B.*b\n    end\nend\n\njulia> profile_test(1)              # run once to compile\n\njulia> @profile profile_test(10)    # collect profiling data\n\njulia> using FlameGraphs\n\njulia> g = flamegraph()\nNode(FlameGraphs.NodeData(ip:0x0, 0x01, 1:125))","category":"page"},{"location":"#","page":"Home","title":"Home","text":"This may not be very informative on its own; the only thing this communicates clearly is that 125 samples (separate backtraces) were collected during profiling.  (For developers, g is a left-child, right-sibling tree.) It becomes more meaningful with","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> using AbstractTrees\n\njulia> print_tree(g)\nFlameGraphs.NodeData(ip:0x0, 0x01, 1:125)\n├─ FlameGraphs.NodeData((::Revise.var\"#85#87\"{REPL.REPLBackend})() at task.jl:333, 0x00, 2:116)\n│  └─ FlameGraphs.NodeData(run_backend(::REPL.REPLBackend) at Revise.jl:1057, 0x00, 2:116)\n│     └─ FlameGraphs.NodeData(eval_user_input(::Any, ::REPL.REPLBackend) at REPL.jl:86, 0x01, 2:116)\n│        └─ FlameGraphs.NodeData(eval(::Module, ::Any) at boot.jl:330, 0x01, 2:116)\n│           ├─ FlameGraphs.NodeData(profile_test(::Int64) at proftest.jl:3, 0x00, 2:32)\n│           │  └─ FlameGraphs.NodeData(randn at normal.jl:190 [inlined], 0x00, 2:32)\n│           │     └─ FlameGraphs.NodeData(randn(::Random.MersenneTwister, ::Type{Float64}, ::Int64, ::Int64, ::Vararg{Int64,N} where N) at normal.jl:184, 0x01, 2:32)\n│           │        ├─ FlameGraphs.NodeData(Array{Float64,N} where N(::UndefInitializer, ::Int64, ::Int64, ::Int64) at boot.jl:420, 0x00, 2:8)\n│           │        │  └─ FlameGraphs.NodeData(Array at boot.jl:408 [inlined], 0x02, 2:8)\n│           │        ├─ FlameGraphs.NodeData(randn!(::Random.MersenneTwister, ::Array{Float64,3}) at normal.jl:0, 0x00, 9:9)\n│           │        └─ FlameGraphs.NodeData(randn!(::Random.MersenneTwister, ::Array{Float64,3}) at normal.jl:173, 0x00, 10:32)\n│           │           ├─ FlameGraphs.NodeData(randn(::Random.MersenneTwister, ::Type{Float64}) at gcutils.jl:91, 0x00, 10:12)\n...","category":"page"},{"location":"#","page":"Home","title":"Home","text":"Each node of the tree consists of a StackFrame indicating the file, function, and line number of a particular entry in one or more backtraces, a status flag, and a range that corresponds to the horizontal span of a particular node when the graph is rendered.  See FlameGraphs.NodeData for more information.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"flamegraph has several options that can be used to control how it computes the graph.","category":"page"},{"location":"#Rendering-a-flame-graph-1","page":"Home","title":"Rendering a flame graph","text":"","category":"section"},{"location":"#","page":"Home","title":"Home","text":"You can create a \"bitmap\" representation of the flame graph with flamepixels:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"julia> img = flamepixels(g)\n125×20 Array{RGB{N0f8},2} with eltype ColorTypes.RGB{FixedPointNumbers.Normed{UInt8,8}}:\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)      …  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)   …  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)      RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n ⋮                                                   ⋱                                                                        \n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.62,0.62,0.62)   …  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.659,0.635,0.0)  …  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(1.0,1.0,1.0)         RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.804,0.725,1.0)     RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)\n RGB{N0f8}(1.0,0.0,0.0)  RGB{N0f8}(0.804,0.725,1.0)     RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)  RGB{N0f8}(1.0,1.0,1.0)","category":"page"},{"location":"#","page":"Home","title":"Home","text":"You can display this in an image viewer, but for interactive exploration ProfileView.jl adds additional features.","category":"page"},{"location":"#","page":"Home","title":"Home","text":"The coloration scheme can be customized as described in the documentation for flamepixels, with the default coloration provided by FlameColors. This default uses cycling colors to distinguish different stack frames, while coloring runtime dispatch red and garbage-collection orange. If we profile \"time to first plot,\"","category":"page"},{"location":"#","page":"Home","title":"Home","text":"using Plots, Profile, FlameGraphs\n@profile plot(rand(5))    # \"time to first plot\"\ng = flamegraph(C=true)\nimg = flamepixels(g)","category":"page"},{"location":"#","page":"Home","title":"Home","text":"we might get something like this:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"(Image: default_colors)","category":"page"},{"location":"#","page":"Home","title":"Home","text":"An alternative is to color frames by their category:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"img = flamepixels(StackFrameCategory(), g)","category":"page"},{"location":"#","page":"Home","title":"Home","text":"in which case we might get something like this:","category":"page"},{"location":"#","page":"Home","title":"Home","text":"(Image: default_colors)","category":"page"},{"location":"#","page":"Home","title":"Home","text":"In this plot, dark gray indicates time spent in Core.Compiler (mostly inference), yellow in LLVM, orange other ccalls, light blue in Base, and red is uncategorized (mostly package code).","category":"page"},{"location":"#","page":"Home","title":"Home","text":"StackFrameCategory allows you to customize these choices and recognize arbitrary modules.","category":"page"}]
}