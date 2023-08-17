import sys
import base64

from mlflow.entities._mlflow_object import _MLflowObject
from mlflow.protos.service_pb2 import Param as ProtoParam


class Param(_MLflowObject):
    """
    Parameter object.
    """

    def __init__(self, key, value):
        if "pyspark.ml" in sys.modules:
            import pyspark.ml.param

            if isinstance(key, pyspark.ml.param.Param):
                key = key.name
                value = str(value)
        self._key = key
        self._value = value

    @property
    def key(self):
        """String key corresponding to the parameter name."""
        return self._key

    @property
    def value(self):
        """String value of the parameter."""
        return self._value

    def to_proto(self):
        param = ProtoParam()
        k = str(self.key)
        k_enc = base64.urlsafe_b64encode(k.encode())
        k_enc = k_enc.decode().replace("=", ' ')
        if len(k_enc) > 250:
            k_enc = k_enc[:248]
        v = str(self.value)
        v_enc = base64.urlsafe_b64encode(v.encode())
        v_enc = v_enc.decode().replace("=", ' ')
        if len(v_enc) > 250:
            v_enc = v_enc[:248]
        param.key = k_enc
        param.value = v_enc
        return param

    @classmethod
    def from_proto(cls, proto):
        return cls(proto.key, proto.value)

    def __eq__(self, __o):
        if isinstance(__o, self.__class__):
            return self._key == __o._key

        return False

    def __hash__(self):
        return hash(self._key)
