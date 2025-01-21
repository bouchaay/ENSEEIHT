#!/usr/bin/env -P /usr/bin:/usr/local/bin python3 -B
# coding: utf-8

#
#  IndicatorCalculator.py
#  IndicatorCalculator version 1.0
#  Created by Ingenuity i/o on 2025/01/15
#
# "no description"
#
import ingescape as igs


class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class IndicatorCalculator(metaclass=Singleton):
    def __init__(self):
        # inputs
        self.historical_dataI = None
        self.indicators_paramI = None

        # outputs
        self._indicatorsO = None

    # outputs
    @property
    def indicatorsO(self):
        return self._indicatorsO

    @indicatorsO.setter
    def indicatorsO(self, value):
        self._indicatorsO = value
        if self._indicatorsO is not None:
            igs.output_set_data("indicators", value)


