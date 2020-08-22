
function mkdoc() {
  npx typedoc \
    --name "$3" \
    --inputFiles "packages/$2/src" \
    --out $1 \
    --theme minimal \
    --tsconfig "packages/$2/tsconfig.json" \
    --readme none \
    --mode file
}

mkdoc docs/typedoc core "Pipcook Core APIs"
mkdoc docs/typedoc/sdk sdk "Pipcook SDK"
