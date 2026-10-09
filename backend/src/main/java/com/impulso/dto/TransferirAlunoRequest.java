package com.impulso.dto;

import jakarta.validation.constraints.NotNull;

public record TransferirAlunoRequest(@NotNull(message = "Informe o profissional de destino!") Long profissionalId) {
}
