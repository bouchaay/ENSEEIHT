#!/usr/bin/env -P /usr/bin:/usr/local/bin python3 -B
# coding: utf-8

#
#  OrderManager.py
#  OrderManager version 1.0
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


class OrderManager(metaclass=Singleton):
    def __init__(self):
        # inputs
        self.manual_orderI = None

        # outputs
        self._order_resultO = None

    # outputs
    @property
    def order_resultO(self):
        return self._order_resultO

    @order_resultO.setter
    def order_resultO(self, value):
        self._order_resultO = value
        if self._order_resultO is not None:
            igs.output_set_data("order_result", value)


