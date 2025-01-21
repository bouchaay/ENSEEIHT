#!/usr/bin/env -P /usr/bin:/usr/local/bin python3 -B
# coding: utf-8

#
#  MarketDataFetcher.py
#  MarketDataFetcher version 1.0
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


class MarketDataFetcher(metaclass=Singleton):
    def __init__(self):
        # inputs
        self.symbolI = None
        self.timeframeI = None
        self.start_timeI = None
        self.end_timeI = None
        self.fetch_requestI = None

        # outputs
        self._historical_dataO = None

    # outputs
    @property
    def historical_dataO(self):
        return self._historical_dataO

    @historical_dataO.setter
    def historical_dataO(self, value):
        self._historical_dataO = value
        if self._historical_dataO is not None:
            igs.output_set_data("historical_data", value)


