
function mkdoc() {
  npx typedoc \
    --name "$3" \
    --inputFiles "packages/$2/src" \
    --out $1 \
    --theme default \
    --tsconfig "packages/$2/tsconfig.json" \
    --readme none \
    --mode file
}

mkdoc docs/typedoc/script core "Pipcook Interfaces"
mkdoc docs/typedoc/runtime costa "Costa Interfaces"
