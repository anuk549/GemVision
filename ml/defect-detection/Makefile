PYTHON ?= /home/anuk/Downloads/gem/venv/bin/python
NOTEBOOK := notebooks/sapphire_defect_classifier.ipynb

.PHONY: run clean

run:
	$(PYTHON) -m nbconvert --to notebook --execute --inplace $(NOTEBOOK)

clean:
	$(PYTHON) -m nbconvert --clear-output --inplace $(NOTEBOOK)
