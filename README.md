# DistributionBuilder
A Javascript library to conveniently add distribution builders to your online and offline experiments.

## Changelog:

### v1.1 (master)

* The width of the distribution builder is now automatically adjusted
using CSS `flexbox`.
* The argument `resize` of `DistributionBuilder.render()` will be
deprecated in future versions. For compatibility reasons, using the
`resize` argument does not raise an error, but it no longer affects the
behavior of the distributio builder.
* Changed the HTML structure: the inner `<div class="cell"></div>` now
includes a `<div class="ball"></div>`. The appearance of the "balls" in
the distribution builder can now be changed more easily.
* The method `getDistribution()` now returns a copy of the current allocation. This is to avoid accidental side-effects.


### v1.0
* First release of the library.


[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.166736.svg)](https://doi.org/10.5281/zenodo.166736)