import { usePacientesStore } from 'src/stores/pacientesStore'
import { useQuasar } from 'quasar'

export const usePacientes = () => {
  const pacientesStore = usePacientesStore()
  const $q = useQuasar()

  const salvarPaciente = async (dados) => {
    const ehEdicao = !!dados.id
    const resultado = ehEdicao
      ? await pacientesStore.putPacienteAction({ paciente: dados })
      : await pacientesStore.postPacienteAction(dados)

    $q.notify({
      type: resultado.sucesso ? 'positive' : 'negative',
      message: resultado.mensagem,
    })

    return resultado
  }

  const removerPaciente = async (paciente) => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Remover paciente',
        message: `Deseja remover ${paciente.contatos?.nome}? Esta ação não pode ser desfeita.`,
        cancel: true,
        ok: { label: 'Remover', color: 'negative', flat: true },
      }).onOk(async () => {
        const resultado = await pacientesStore.deletePacienteAction({ paciente })
        $q.notify({
          type: resultado.sucesso ? 'positive' : 'negative',
          message: resultado.mensagem,
        })
        resolve(resultado)
      })
    })
  }

  return {
    pacientesStore,
    salvarPaciente,
    removerPaciente,
  }
}
