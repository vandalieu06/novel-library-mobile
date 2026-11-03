# novel-library-mobile — comandos de día a día
#
# Nota sobre `clean`: `./gradlew clean assembleRelease` falla en este proyecto
# porque la tarea clean borra los prefab-headers de react-native-worklets antes
# de que expo-modules-core regenere su CMake. `make clean` borra artefactos sin
# invocar `gradlew clean`; `make build-release` regenera el prefab y compila.
#
# Uso: `make` o `make help` para ver la lista.

SHELL := /bin/bash
.DEFAULT_GOAL := help

PKG            := com.anonymous.novellibrarymobile
ADB            ?= adb
METRO_PORT     ?= 8081
METRO_URL      ?= http://localhost:$(METRO_PORT)
BACKEND_PORT   ?= 8000
APK            := android/app/build/outputs/apk/release/app-release.apk
SHOT           ?= /tmp/novel-library-mobile.png
MOBILE_DEVICE  ?= Expo

# Codifica la URL de Metro para el deep link del dev client.
METRO_ENCODED  = $(subst :,%3A,$(subst /,%2F,$(METRO_URL)))

.PHONY: help install start start-clear android prebuild build-release \
        android-release apk install-apk typecheck lint check doctor devices \
        reverse deep-link backend-test backend-test-emu logs screenshot \
        mobile-tree mobile-shot clean clean-js

help: ## Muestra esta ayuda
	@awk 'BEGIN {FS = ":.*##"; printf "\nUso: make <target>\n\n"} \
		/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

## --- Dependencias y desarrollo ---------------------------------------------

install: ## Instala dependencias con pnpm
	pnpm install

start: ## Arranca Metro para el dev client
	pnpm exec expo start --dev-client

start-clear: ## Metro limpiando caché (módulos viejos, errores raros)
	pnpm exec expo start --dev-client --clear

android: ## Build + instala el dev client y arranca Metro (recomendado)
	pnpm run android

prebuild: ## Regenera android/ desde app.json (splash, iconos, permisos)
	pnpm exec expo prebuild --platform android

## --- Release ----------------------------------------------------------------

build-release: ## APK release (regenera prefab de worklets; sin gradlew clean)
	cd android && ./gradlew :react-native-worklets:prepareWorkletsHeadersForPrefabs
	cd android && ./gradlew assembleRelease
	@echo "APK: $(APK)"

apk: build-release ## Alias de build-release

android-release: prebuild build-release ## prebuild + APK release
	@echo "Listo: $(APK)"

install-apk: ## Instala el APK release en el emulador (reemplaza el dev client)
	$(ADB) install -r "$(APK)"

## --- Calidad ----------------------------------------------------------------

typecheck: ## TypeScript sin emitir
	pnpm exec tsc --noEmit

lint: ## ESLint (expo lint)
	pnpm exec expo lint

check: typecheck lint ## typecheck + lint
	@echo "ok"

doctor: ## Diagnóstico de dependencias/config de Expo
	pnpm exec expo-doctor

## --- Emulador / dispositivo -------------------------------------------------

devices: ## Lista dispositivos conectados
	$(ADB) devices -l

reverse: ## Mapea Metro y backend al emulador (adb reverse)
	$(ADB) reverse tcp:$(METRO_PORT) tcp:$(METRO_PORT)
	$(ADB) reverse tcp:$(BACKEND_PORT) tcp:$(BACKEND_PORT)
	@$(ADB) reverse --list

deep-link: ## Abre el dev client apuntando a Metro
	$(ADB) shell am start -a android.intent.action.VIEW \
		-d "exp+novel-library-mobile://expo-development-client/?url=$(METRO_ENCODED)"

logs: ## Logs de React Native / crashes
	$(ADB) logcat ReactNativeJS:V ReactNative:V AndroidRuntime:E '*:S'

screenshot: ## Captura de pantalla vía adb
	$(ADB) exec-out screencap -p > "$(SHOT)"
	@echo "Captura: $(SHOT)"

## --- Backend ----------------------------------------------------------------

backend-test: ## Comprueba la API desde el host
	curl -fsS -o /dev/null -w "API %{http_code}\n" \
		http://127.0.0.1:$(BACKEND_PORT)/api/novels

backend-test-emu: ## Comprueba que el emulador llega al host (10.0.2.2)
	$(ADB) shell 'printf "GET /api/novels HTTP/1.0\r\n\r\n" | nc -w 5 10.0.2.2 $(BACKEND_PORT) | head -1'

## --- mobilecli (MCP) --------------------------------------------------------

mobile-tree: ## Árbol de UI del emulador (mobilecli)
	mobilecli snapshot --device $(MOBILE_DEVICE)

mobile-shot: ## Captura vía mobilecli
	mobilecli screenshot --device $(MOBILE_DEVICE) --output "$(SHOT)"
	@echo "Captura: $(SHOT)"

## --- Limpieza ---------------------------------------------------------------

clean: ## Borra artefactos Android (NO usa gradlew clean)
	rm -rf android/app/build android/build
	@echo "Build de Android borrado. Siguiente: make build-release"

clean-js: ## Borra caché de Expo/Metro
	rm -rf .expo node_modules/.cache
	@echo "Caché JS borrada. Siguiente: make start-clear"
