-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-11-2026 a las 04:47:19
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `la_nueva_parisienne`
--
CREATE DATABASE IF NOT EXISTS `la_nueva_parisienne` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `la_nueva_parisienne`;


-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asientos_contables`
--

CREATE TABLE `asientos_contables` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp(),
  `concepto` text NOT NULL,
  `modulo_origen` varchar(100) NOT NULL,
  `icono` varchar(20) DEFAULT 'receipt',
  `total_debe` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_haber` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asientos_contables`
--

INSERT INTO `asientos_contables` (`id`, `codigo`, `fecha_hora`, `concepto`, `modulo_origen`, `icono`, `total_debe`, `total_haber`) VALUES
('as_001', 'AS-2026-001', '2026-08-11 16:42:00', 'Venta POS Mostrador (Comprobante FAC-2026-1003)', 'Punto de Venta (POS)', 'shopping-cart', 1485.50, 1485.50),
('as_002', 'AS-2026-002', '2026-08-10 14:15:00', 'Compra de Harina a Molinos del Sur (Orden OC-2026-0089)', 'Proveedores', 'wheat', 1800.00, 1800.00),
('as_pag_1793389702_81b6', 'AS-PAG-20261030-154822', '2026-10-30 15:48:22', 'Pago Orden OC-2026-0088 a Chocolates del Rey - Transferencia Bancaria (Banesco Banco Universal) [Ref: TRANSF-98102] - Nota: Pago liquidado', 'Proveedores y Compras', 'credit-card', 600.00, 600.00),
('as_pos_1793321523', 'AS-POS-20261029-205203', '2026-10-29 20:52:03', 'Venta POS Mostrador (Comprobante FAC-2026-TEST) - Para Llevar', 'Punto de Venta (POS)', 'shopping-cart', 15.50, 15.50);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asientos_detalle`
--

CREATE TABLE `asientos_detalle` (
  `id` int(11) NOT NULL,
  `asiento_id` varchar(50) NOT NULL,
  `cuenta_codigo` varchar(20) NOT NULL,
  `debe` decimal(10,2) NOT NULL DEFAULT 0.00,
  `haber` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `asientos_detalle`
--

INSERT INTO `asientos_detalle` (`id`, `asiento_id`, `cuenta_codigo`, `debe`, `haber`) VALUES
(1, 'as_001', '1105', 1485.50, 0.00),
(2, 'as_001', '4135', 0.00, 1280.60),
(3, 'as_001', '2408', 0.00, 204.90),
(4, 'as_002', '1435', 1800.00, 0.00),
(5, 'as_002', '2205', 0.00, 1800.00),
(6, 'as_pos_1793321523', '1105', 15.50, 0.00),
(7, 'as_pos_1793321523', '4135', 0.00, 15.50),
(8, 'as_pos_1793321523', '2408', 0.00, 2.48),
(9, 'as_pag_1793389702_81b6', '2205', 600.00, 0.00),
(10, 'as_pag_1793389702_81b6', '1110', 0.00, 600.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora`
--

CREATE TABLE `bitacora` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `usuario` varchar(100) NOT NULL,
  `rol` varchar(50) NOT NULL,
  `modulo` varchar(50) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `descripcion` text NOT NULL,
  `severidad` enum('INFO','WARNING','DANGER') NOT NULL DEFAULT 'INFO',
  `datos_previos` longtext DEFAULT NULL,
  `datos_nuevos` longtext DEFAULT NULL,
  `ip_origen` varchar(45) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `hash_previo` varchar(64) DEFAULT NULL,
  `hash_firma` varchar(64) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `bitacora`
--

INSERT INTO `bitacora` (`id`, `user_id`, `usuario`, `rol`, `modulo`, `accion`, `descripcion`, `severidad`, `datos_previos`, `datos_nuevos`, `ip_origen`, `user_agent`, `hash_previo`, `hash_firma`, `creado_en`) VALUES
(1, NULL, 'Sistema / Anónimo', 'INVITADO', 'SISTEMA', 'INICIALIZACION', 'Bitacora inicializada con exito', 'INFO', NULL, '{\"version\":\"1.0\"}', '127.0.0.1', 'Desconocido', 'e97bcb17b3a261b1f511812b77ab3e43d492ad557e3aa5320126a4987380fee4', '514e373c6cd1e9748e7d99d674c26dd9cb0a100ebf149fa21a6aeb67929eb629', '2026-11-01 23:38:31'),
(2, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '514e373c6cd1e9748e7d99d674c26dd9cb0a100ebf149fa21a6aeb67929eb629', '539f516781582e594243ff26aa3c5849dfbec02c099523f40e3418864b4ca772', '2026-11-02 02:27:44'),
(3, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '539f516781582e594243ff26aa3c5849dfbec02c099523f40e3418864b4ca772', 'd8d26c791126d0831fd1160baf9e25a826dfef6f63faf409aaff73dc6f61458c', '2026-11-02 02:27:51'),
(4, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'd8d26c791126d0831fd1160baf9e25a826dfef6f63faf409aaff73dc6f61458c', 'a96d6871a73b19269552e47793ea33e634443a2ab2ae5add7c37f00c7219626e', '2026-11-02 02:27:55'),
(5, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'a96d6871a73b19269552e47793ea33e634443a2ab2ae5add7c37f00c7219626e', '046384094b104284dc5b68c1df2eba7b22b8c2b295a567fb253ba79a86e135f1', '2026-11-02 11:44:41'),
(6, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '046384094b104284dc5b68c1df2eba7b22b8c2b295a567fb253ba79a86e135f1', '43cd3ee61462af8c12730a270aac515067ee7aeef7cb17ea1ae0600d03371d82', '2026-11-02 11:44:44'),
(7, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '43cd3ee61462af8c12730a270aac515067ee7aeef7cb17ea1ae0600d03371d82', '8e8a6333bbcf1efc135299396c55309ee8e0a2a6983e28b9628f37f64932de46', '2026-11-02 11:44:47'),
(8, '1', 'Administrador Maestro', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (7 registros verificados en 0.42ms).', 'INFO', NULL, NULL, '127.0.0.1', 'Desconocido', '8e8a6333bbcf1efc135299396c55309ee8e0a2a6983e28b9628f37f64932de46', 'cb1a126a77967d4a5316bb625e6f7bd5638ef7ec99af5dc03e3110279153c90f', '2026-11-02 12:17:17'),
(9, '1', 'Administrador Maestro', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (8 registros verificados en 0.46ms).', 'INFO', NULL, NULL, '127.0.0.1', 'Desconocido', 'cb1a126a77967d4a5316bb625e6f7bd5638ef7ec99af5dc03e3110279153c90f', 'd8d048a0e20886f7fd8d964c75609db158527602045c78600624fbd47a9ec0b9', '2026-11-02 12:17:23'),
(10, '1', 'Administrador Maestro', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 9.', 'INFO', NULL, NULL, '127.0.0.1', 'Desconocido', 'd8d048a0e20886f7fd8d964c75609db158527602045c78600624fbd47a9ec0b9', 'cca6f6a4a152b63d38a13bb1fbaf15d25c9b399e010fb9adedfc691c2c735174', '2026-11-02 14:22:39'),
(11, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cca6f6a4a152b63d38a13bb1fbaf15d25c9b399e010fb9adedfc691c2c735174', '56dad6646c823c7e12aa541c8a2a26e98b7f7fff182e13a2af0db4a58c91ed25', '2026-11-02 20:15:56'),
(12, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '56dad6646c823c7e12aa541c8a2a26e98b7f7fff182e13a2af0db4a58c91ed25', 'ce86545d8b1f9f848d11b2df7ac21e7258ee97e91385dcdb62ca50ad0417c9f9', '2026-11-02 20:16:07'),
(13, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'ce86545d8b1f9f848d11b2df7ac21e7258ee97e91385dcdb62ca50ad0417c9f9', '2f49906a89f3eb32edffe5575a6617c74598d6ddc3315908eb1dc56669a1fc52', '2026-11-02 20:16:09'),
(14, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'curl/8.9.1', '2f49906a89f3eb32edffe5575a6617c74598d6ddc3315908eb1dc56669a1fc52', '9bcf437d189595b1d9bc7f03503235b277efa7f85afe8584c97953c8a3620c51', '2026-11-02 20:23:55'),
(15, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (14 registros verificados en 0.64ms).', 'INFO', NULL, NULL, '127.0.0.1', 'Desconocido', '9bcf437d189595b1d9bc7f03503235b277efa7f85afe8584c97953c8a3620c51', 'f8f7758cac197710168265a9ba955dbc2537b1c30842bdc4b0bcfa69f7849698', '2026-11-02 20:27:51'),
(16, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 15.', 'INFO', NULL, NULL, '127.0.0.1', 'Desconocido', 'f8f7758cac197710168265a9ba955dbc2537b1c30842bdc4b0bcfa69f7849698', 'b84e0558f0c8ae8ed7e40054002d046260566290809bc054d0738bdf5ca3bb81', '2026-11-02 20:30:17'),
(17, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (16 registros verificados en 0.46ms).', 'INFO', NULL, NULL, '::1', 'curl/8.9.1', 'b84e0558f0c8ae8ed7e40054002d046260566290809bc054d0738bdf5ca3bb81', '3917f32d05678d0474eeaa5a0d8f1492a838a0acde535edf95b187beba293f26', '2026-11-02 20:35:01'),
(18, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 17.', 'INFO', NULL, NULL, '::1', 'curl/8.9.1', '3917f32d05678d0474eeaa5a0d8f1492a838a0acde535edf95b187beba293f26', 'f4b845b9e5c2f12c180a51692fae6bf8985b4c64006b3d2d282a1cc68d0d863c', '2026-11-02 20:35:10'),
(19, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'f4b845b9e5c2f12c180a51692fae6bf8985b4c64006b3d2d282a1cc68d0d863c', '1076f2e87541717a73aa13bfb587f44898d8c4d2362e164ea8737678fdf14f80', '2026-11-02 20:40:06'),
(20, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '1076f2e87541717a73aa13bfb587f44898d8c4d2362e164ea8737678fdf14f80', '101b0658b48bb10767f64c0b410bbcb24ecb9c36aa9c994491063ed502e263b1', '2026-11-02 20:40:11'),
(21, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_FALLIDO', 'Patrón gestual incorrecto.', 'DANGER', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"fallido\",\"detalles\":\"Patrón gestual incorrecto.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '101b0658b48bb10767f64c0b410bbcb24ecb9c36aa9c994491063ed502e263b1', '21d48d707fa63cc649c3dc4529ba4c84e02dcc94fd50ca2147ea1b2dd3ee8eb3', '2026-11-02 20:40:14'),
(22, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_FALLIDO', 'Patrón gestual incorrecto.', 'DANGER', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"fallido\",\"detalles\":\"Patrón gestual incorrecto.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '21d48d707fa63cc649c3dc4529ba4c84e02dcc94fd50ca2147ea1b2dd3ee8eb3', '56824799c9a94686a3b8661f2c7671b6e8dc8d656704f72db9849faf2d6bfb69', '2026-11-02 20:40:16'),
(23, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '56824799c9a94686a3b8661f2c7671b6e8dc8d656704f72db9849faf2d6bfb69', 'd79c4776d5d8e75cc1a19de7ca354579c7a6afbf5b4424cd74f81bebf72d29fc', '2026-11-02 20:40:22'),
(24, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'd79c4776d5d8e75cc1a19de7ca354579c7a6afbf5b4424cd74f81bebf72d29fc', '800e67e7249d9c6fe868947e0119540c1b5826b956f7450fbe5cc24109ca16a5', '2026-11-02 21:17:36'),
(25, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '800e67e7249d9c6fe868947e0119540c1b5826b956f7450fbe5cc24109ca16a5', '415ae57b007ac386adc3bc3032f73d540995e38620fa6e2867f9701bed14bfa7', '2026-11-02 21:17:42'),
(26, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '415ae57b007ac386adc3bc3032f73d540995e38620fa6e2867f9701bed14bfa7', 'd92d15df83146bda338997822f3db023b7afcc948854edbf256f1084f6064a32', '2026-11-02 21:17:45'),
(27, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'd92d15df83146bda338997822f3db023b7afcc948854edbf256f1084f6064a32', '5634f98c35a4d548ac939561023a47c82bbd8a7218cd6d26cfceea145aacf922', '2026-11-04 02:18:52'),
(28, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '5634f98c35a4d548ac939561023a47c82bbd8a7218cd6d26cfceea145aacf922', '2ece1b3dbf0394da09254b4d4225b6abdbd39bae0feaf293687ac8022e7e701f', '2026-11-04 02:18:56'),
(29, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2ece1b3dbf0394da09254b4d4225b6abdbd39bae0feaf293687ac8022e7e701f', 'df8606e0885cdf6d1852fc1c6d3bf681474cf4a9145995d3757c8d8ec40a1472', '2026-11-04 02:18:59'),
(30, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (29 registros verificados en 35.42ms).', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; es-VE) WindowsPowerShell/5.1.19041.5737', 'df8606e0885cdf6d1852fc1c6d3bf681474cf4a9145995d3757c8d8ec40a1472', '7991bf86035a7baf96319888b7a858c251739a552bc4988e2d4ccf50570d6796', '2026-11-04 12:25:19'),
(31, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 30.', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; es-VE) WindowsPowerShell/5.1.19041.5737', '7991bf86035a7baf96319888b7a858c251739a552bc4988e2d4ccf50570d6796', '97b8414742e6315926ab64a09f17e4a3aca430dc621654dd130af0596daf8a52', '2026-11-04 12:25:35'),
(32, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (31 registros verificados en 0.61ms).', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/135.0.0.0 Safari/537.36', '97b8414742e6315926ab64a09f17e4a3aca430dc621654dd130af0596daf8a52', '610848e534d2f7afcf5996fbf305d4d300fe219109b9e9a6544e21590ff8d151', '2026-11-04 12:26:38'),
(33, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '610848e534d2f7afcf5996fbf305d4d300fe219109b9e9a6544e21590ff8d151', 'e39b495e08f9e8ee363c9c36425a2a10623601faaba8bbc000dbd973c7ee417c', '2026-11-04 12:28:34'),
(34, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'e39b495e08f9e8ee363c9c36425a2a10623601faaba8bbc000dbd973c7ee417c', '0354d7747337a1536dd1b6e1d6304d1085a7b0d9a4d761b0dbaca34ea234470e', '2026-11-04 12:28:38'),
(35, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_FALLIDO', 'Patrón gestual incorrecto.', 'DANGER', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"fallido\",\"detalles\":\"Patrón gestual incorrecto.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '0354d7747337a1536dd1b6e1d6304d1085a7b0d9a4d761b0dbaca34ea234470e', '2c56a9e588930cf76bd964b6f1d8b2e1b76a641022dd14db0e1bfa2ffdd87966', '2026-11-04 12:28:42'),
(36, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2c56a9e588930cf76bd964b6f1d8b2e1b76a641022dd14db0e1bfa2ffdd87966', '6aa1841b1c75048308cbdad9ad8d817a7114f50d5a6fd476fd16e5ba2d81ab48', '2026-11-04 12:28:45'),
(37, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 36.', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '6aa1841b1c75048308cbdad9ad8d817a7114f50d5a6fd476fd16e5ba2d81ab48', 'd79efd16cad98dd861c861880ace3b311c88c92f703bade62037b529a19f7189', '2026-11-04 12:30:24'),
(38, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'EXPORTAR_REPORTE_PDF', 'Generación de informe oficial de auditoría en PDF. Total de eventos exportados: 37.', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'd79efd16cad98dd861c861880ace3b311c88c92f703bade62037b529a19f7189', '440f13dbd95d7dee9c6fb46145c43f02fe40757643333c60cdc3c393ea31d0bb', '2026-11-04 12:33:21'),
(39, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'SEGURIDAD', 'VERIFICACION_INTEGRIDAD', 'Verificación forense exitosa: Cadena de custodia HMAC-SHA256 100% íntegra (38 registros verificados en 1.39ms).', 'INFO', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '440f13dbd95d7dee9c6fb46145c43f02fe40757643333c60cdc3c393ea31d0bb', '12ca2083f528bb55f164c81e1679f80be33b7d8175480bbbc3877a6798e6a1f0', '2026-11-04 12:33:53'),
(40, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere 2FA (Tipo: ambos)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '12ca2083f528bb55f164c81e1679f80be33b7d8175480bbbc3877a6798e6a1f0', 'efc5d499a92cd3fcae2f20a06bdceaf0702174bca226a492fc4351f3f788d6e3', '2026-11-04 12:38:50'),
(41, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_TOTP_2FA_EXITO', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', 'INFO', NULL, '{\"tipo_intento\":\"totp_2fa\",\"estado\":\"exitoso\",\"detalles\":\"Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'efc5d499a92cd3fcae2f20a06bdceaf0702174bca226a492fc4351f3f788d6e3', '1477043b0b45f9d5a76515addcfbaa010b101a469312e8af3b6b87ff2fc35f43', '2026-11-04 12:39:09'),
(42, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Super Administrador.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '1477043b0b45f9d5a76515addcfbaa010b101a469312e8af3b6b87ff2fc35f43', 'd843b2033fe54fe0defda7174f604ef4f80dc23e151a2b3297f638d63e27ad9e', '2026-11-04 12:39:11'),
(43, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'PERSONAL', 'CREAR_EMPLEADO', 'Registro de nuevo empleado \'Wiston Smith\' (usr_wiston_16) con rol SUPERADMIN', 'INFO', NULL, '{\"id\":\"usr_wiston_16\",\"codigo\":\"EMP-008\",\"username\":\"Director\",\"nombre\":\"Wiston Smith\",\"rol\":\"SUPERADMIN\",\"turno\":\"Turno Completo\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'd843b2033fe54fe0defda7174f604ef4f80dc23e151a2b3297f638d63e27ad9e', 'cddce897afa0eae2584d1937d0592f111334a17d448d09d7d5a9f684173c9654', '2026-11-04 12:40:39'),
(44, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'AUTH', 'AUTH_CAMBIO_PIN_EXITO', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', 'INFO', NULL, '{\"tipo_intento\":\"cambio_pin\",\"estado\":\"exitoso\",\"detalles\":\"Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cddce897afa0eae2584d1937d0592f111334a17d448d09d7d5a9f684173c9654', '7b0f555cafe41797eb2afafe08bae1c6a6b3976221fb315c24f411eb1727b8b5', '2026-11-04 12:40:46'),
(45, 'usr_superadmin', 'superadmin', 'SUPERADMIN', 'PERSONAL', 'CAMBIO_CREDENCIALES', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', 'WARNING', '{\"id\":\"usr_superadmin\",\"username\":\"superadmin\",\"nombre\":\"Super Administrador\"}', '{\"tipos_modificados\":[\"Patrón Gestual 3x3\"]}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '7b0f555cafe41797eb2afafe08bae1c6a6b3976221fb315c24f411eb1727b8b5', '0c5f94937e995317c4d713b093e3443cddb06a394aa177d9d9c3f9b9f83eb23d', '2026-11-04 12:40:46'),
(46, 'usr_wiston_16', 'Director', 'SUPERADMIN', 'AUTH', 'AUTH_PRIMARIO_EXITO', 'Paso 1 validado. Requiere Patrón Gestual 3x3.', 'INFO', NULL, '{\"tipo_intento\":\"primario\",\"estado\":\"exitoso\",\"detalles\":\"Paso 1 validado. Requiere Patrón Gestual 3x3.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '0c5f94937e995317c4d713b093e3443cddb06a394aa177d9d9c3f9b9f83eb23d', '70637836bfb625a4e571101372acef0c37577179a6af3d3ddad2ba17944b8036', '2026-11-04 12:40:58'),
(47, 'usr_wiston_16', 'Director', 'SUPERADMIN', 'AUTH', 'AUTH_PATRON_SEGURIDAD_EXITO', 'Patrón Gestual 3x3 validado exitosamente para Wiston Smith.', 'INFO', NULL, '{\"tipo_intento\":\"patron_seguridad\",\"estado\":\"exitoso\",\"detalles\":\"Patrón Gestual 3x3 validado exitosamente para Wiston Smith.\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '70637836bfb625a4e571101372acef0c37577179a6af3d3ddad2ba17944b8036', '1ff117c1782cabcfc7fe9b68bfd0585430066dac9a046e9548b7fe857b31ad88', '2026-11-04 12:41:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_producto`
--

CREATE TABLE `categorias_producto` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias_producto`
--

INSERT INTO `categorias_producto` (`id`, `nombre`, `descripcion`) VALUES
('cat_cafeteria', 'Cafetería & Bebidas', 'Café espresso, cappuccino, café au lait y jugos.'),
('cat_especialidades', 'Especialidades & Desayunos', 'Croque-Monsieur, quiches y desayunos artesanales.'),
('cat_panaderia', 'Panadería Artesanal', 'Baguettes, brioches y panes de especialidad.'),
('cat_pasteleria', 'Pastelería & Repostería', 'Éclairs, tartas de limón, macarons y milhojas.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comandas_cocina`
--

CREATE TABLE `comandas_cocina` (
  `id` varchar(50) NOT NULL,
  `numero_factura` varchar(50) NOT NULL,
  `detalles_pedido` text NOT NULL,
  `estado_preparacion` varchar(50) NOT NULL DEFAULT 'pending',
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `comandas_cocina`
--

INSERT INTO `comandas_cocina` (`id`, `numero_factura`, `detalles_pedido`, `estado_preparacion`, `fecha_hora`) VALUES
('com_1001', 'FAC-2026-1001', '3x Baguette Tradicional Parisina, 2x Éclair de Chocolate Belga', 'ready', '2026-08-22 15:35:00'),
('com_1002', 'FAC-2026-1002', '2x Croissant de Mantequilla, 1x Pain au Chocolat', 'in_progress', '2026-08-22 15:50:00'),
('com_1003', 'FAC-2026-1003', '2x Croque-Monsieur Tradicional, 2x Café au Lait Parisien', 'pending', '2026-08-22 15:53:00'),
('com_1793321523_315', 'FAC-2026-TEST', '2x Baguette Tradicional', 'pending', '2026-10-29 20:52:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuraciones`
--

CREATE TABLE `configuraciones` (
  `clave` varchar(100) NOT NULL,
  `valor` text NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuraciones`
--

INSERT INTO `configuraciones` (`clave`, `valor`, `descripcion`, `actualizado_en`) VALUES
('bcv_manual_rate', '780', 'Valor de la tasa de cambio ingresado manualmente', '2026-10-30 21:02:16'),
('bcv_rate_mode', 'auto', 'Modo de obtención de la tasa BCV: auto o manual', '2026-10-23 21:54:42'),
('modo_login', 'pos', 'Modalidad de inicio de sesión en index.html: pos o tradicional', '2026-10-23 21:54:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_empresa`
--

CREATE TABLE `configuracion_empresa` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `rif` varchar(30) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `telefono` varchar(50) NOT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracion_empresa`
--

INSERT INTO `configuracion_empresa` (`id`, `nombre`, `rif`, `direccion`, `telefono`, `actualizado_en`) VALUES
(1, 'La Nueva Parisienne C.A.', 'J-40123456-7', 'Av. Lara con Calle 8, Barquisimeto, Edo. Lara', '(0251) 555-1234', '2026-10-31 01:33:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_hornos`
--

CREATE TABLE `estado_hornos` (
  `id` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `tipo` varchar(100) NOT NULL DEFAULT 'Industrial',
  `temperatura_actual` int(11) NOT NULL DEFAULT 150,
  `temperatura_objetivo` int(11) NOT NULL DEFAULT 200,
  `tiempo_restante` int(11) NOT NULL DEFAULT 0,
  `tiempo_total` int(11) NOT NULL DEFAULT 0,
  `estado` varchar(50) NOT NULL DEFAULT 'idle',
  `lote_id` varchar(50) DEFAULT NULL,
  `inicio_en` datetime DEFAULT NULL,
  `fin_estimado` datetime DEFAULT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estado_hornos`
--

INSERT INTO `estado_hornos` (`id`, `nombre`, `tipo`, `temperatura_actual`, `temperatura_objetivo`, `tiempo_restante`, `tiempo_total`, `estado`, `lote_id`, `inicio_en`, `fin_estimado`, `actualizado_en`) VALUES
('oven_01', 'Horno 1 (Giratorio A)', 'Giratorio Industrial', 220, 220, 0, 0, 'idle', NULL, NULL, NULL, '2026-10-24 13:41:30'),
('oven_02', 'Horno 2 (Convección B)', 'Convección Fina', 190, 190, 0, 0, 'idle', NULL, NULL, NULL, '2026-10-24 13:41:32'),
('oven_03', 'Horno 3 (Piedra C)', 'Bóveda de Piedra', 240, 240, 0, 0, 'idle', NULL, NULL, NULL, '2026-10-24 13:41:35'),
('oven_04', 'Horno 4 (Pastelero D)', 'Convección Digital', 160, 175, 0, 0, 'preheating', NULL, NULL, NULL, '2026-10-23 21:54:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `lotes_produccion`
--

CREATE TABLE `lotes_produccion` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `producto` varchar(150) NOT NULL,
  `codigo_producto` varchar(50) DEFAULT NULL,
  `icono` varchar(20) DEFAULT 'croissant',
  `cantidad` int(11) NOT NULL DEFAULT 0,
  `estado_leudado` varchar(100) NOT NULL DEFAULT 'Leudado Completo (100%)',
  `temperatura_recomendada` int(11) DEFAULT 190,
  `tiempo_recomendado_min` int(11) DEFAULT 15,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `lotes_produccion`
--

INSERT INTO `lotes_produccion` (`id`, `codigo`, `producto`, `codigo_producto`, `icono`, `cantidad`, `estado_leudado`, `temperatura_recomendada`, `tiempo_recomendado_min`, `creado_en`) VALUES
('batch_042', 'Lote #042', 'Baguette Tradicional Parisina', NULL, '🥖', 50, 'Entregado a Vitrina', 220, 20, '2026-10-23 21:54:44'),
('batch_043', 'Lote #043', 'Croissant de Mantequilla', NULL, '🥐', 60, 'Entregado a Vitrina', 190, 15, '2026-10-23 21:54:44'),
('batch_044', 'Lote #044', 'Focaccia de Romero y Aceitunas', NULL, '🫓', 20, 'Entregado a Vitrina', 240, 25, '2026-10-23 21:54:44'),
('stage_045', 'Lote #045', 'Pain au Chocolat', NULL, '🍫', 40, 'Leudado Completo (100%)', 190, 15, '2026-10-23 21:54:44'),
('stage_046', 'Lote #046', 'Brioche de Vainilla', NULL, '🍞', 25, 'Barnizado con Huevo Listo', 180, 22, '2026-10-23 21:54:44'),
('stage_047', 'Lote #047', 'Masa de Éclairs (Choux)', NULL, '⚡', 35, 'Reposo en Bandeja (15 min)', 200, 18, '2026-10-23 21:54:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias_primas`
--

CREATE TABLE `materias_primas` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'kg',
  `stock_actual` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 10.00,
  `costo_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ubicacion` varchar(100) DEFAULT 'Almacén Central',
  `icono` varchar(20) DEFAULT 'package',
  `descripcion` text DEFAULT NULL,
  `proveedor_id` varchar(50) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `materias_primas`
--

INSERT INTO `materias_primas` (`id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `ubicacion`, `icono`, `descripcion`, `proveedor_id`, `creado_en`, `actualizado_en`) VALUES
('inv_001', 'MAT-001', 'Harina de Trigo Tradicional T55', 'kg', 18.00, 50.00, 1.80, 'Almacén Principal A-1', 'wheat', 'Harina refinada para panadería francesa.', 'sup_01', '2026-10-23 21:54:42', '2026-10-23 21:54:42'),
('inv_002', 'MAT-002', 'Mantequilla de Normandía 84% M.G.', 'kg', 12.50, 30.00, 8.50, 'Cámara Frigorífica B-2', 'milk', 'Mantequilla de alta grasa para hojaldres.', 'sup_02', '2026-10-23 21:54:42', '2026-10-23 21:54:42'),
('inv_003', 'MAT-003', 'Levadura Madre Activa Tostada', 'kg', 8.00, 15.00, 4.20, 'Refrigerador Insumos', 'package', 'Masa madre natural fermentada.', 'sup_01', '2026-10-23 21:54:42', '2026-10-23 21:54:42'),
('inv_004', 'MAT-004', 'Chocolate Belga 60% Cacao', 'kg', 42.00, 20.00, 12.00, 'Almacén Seco A-3', 'package', 'Cobertura de cacao belga de origen.', 'sup_04', '2026-10-23 21:54:42', '2026-10-23 21:54:42'),
('inv_005', 'MAT-005', 'Azúcar Refinada Extra Fina', 'kg', 45.00, 20.00, 1.50, 'Almacén Seco A-2', 'package', 'Azúcar refinada cristalina para masas leudadas y pastelería fina.', 'sup_01', '2026-10-23 21:54:42', '2026-10-23 21:54:42'),
('inv_006', 'MAT-006', 'Sal Marina de Araya / Sal Refinada', 'kg', 30.00, 10.00, 0.80, 'Almacén Seco A-4', 'package', 'Sal marina purificada para control de fermentación y sabor en panadería.', 'sup_01', '2026-10-23 21:54:42', '2026-10-23 21:54:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_compra`
--

CREATE TABLE `ordenes_compra` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `proveedor_id` varchar(50) NOT NULL,
  `fecha_pedido` date NOT NULL,
  `fecha_entrega` date NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'in_transit',
  `monto_total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ordenes_compra`
--

INSERT INTO `ordenes_compra` (`id`, `codigo`, `proveedor_id`, `fecha_pedido`, `fecha_entrega`, `estado`, `monto_total`) VALUES
('po_001', 'OC-2026-0089', 'sup_01', '2026-08-10', '2026-08-12', 'in_transit', 1800.00),
('po_002', 'OC-2026-0090', 'sup_02', '2026-08-11', '2026-08-11', 'in_transit', 1700.00),
('po_003', 'OC-2026-0088', 'sup_04', '2026-08-05', '2026-08-07', 'paid', 600.00),
('po_004', 'OC-2026-0087', 'sup_03', '2026-08-02', '2026-08-04', 'received', 350.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_compra_detalle`
--

CREATE TABLE `ordenes_compra_detalle` (
  `id` int(11) NOT NULL,
  `orden_id` varchar(50) NOT NULL,
  `materia_prima_id` varchar(50) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT 1.00,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ordenes_compra_detalle`
--

INSERT INTO `ordenes_compra_detalle` (`id`, `orden_id`, `materia_prima_id`, `cantidad`, `precio`) VALUES
(1, 'po_001', 'inv_001', 1000.00, 1.80),
(2, 'po_002', 'inv_002', 200.00, 8.50),
(3, 'po_003', 'inv_004', 50.00, 12.00),
(4, 'po_004', 'inv_005', 100.00, 1.50);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_cuentas`
--

CREATE TABLE `plan_cuentas` (
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `naturaleza` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plan_cuentas`
--

INSERT INTO `plan_cuentas` (`codigo`, `nombre`, `tipo`, `naturaleza`) VALUES
('1105', 'Caja General', 'Activo', 'Deudor'),
('1110', 'Bancos Nacionales', 'Activo', 'Deudor'),
('1435', 'Inventario Materia Prima', 'Activo', 'Deudor'),
('1440', 'Inventario Productos Terminados', 'Activo', 'Deudor'),
('2205', 'Proveedores Nacionales', 'Pasivo', 'Acreedor'),
('2408', 'IVA Débito Fiscal (16%)', 'Pasivo', 'Acreedor'),
('3105', 'Capital Social', 'Patrimonio', 'Acreedor'),
('4135', 'Ventas Mostrador Panadería', 'Ingreso', 'Acreedor'),
('5105', 'Gastos de Personal / Sueldos', 'Gasto', 'Deudor'),
('5195', 'Gastos Mermas y Pérdidas', 'Gasto', 'Deudor'),
('6135', 'Costo de Ventas Producción', 'Costo', 'Deudor');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` varchar(50) NOT NULL,
  `categoria_id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'ud',
  `stock_actual` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 10.00,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tipo` varchar(50) NOT NULL DEFAULT 'finished_product',
  `ubicacion` varchar(100) DEFAULT 'Vitrinas POS',
  `icono` varchar(20) DEFAULT 'croissant',
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `categoria_id`, `codigo`, `nombre`, `unidad_medida`, `stock_actual`, `stock_minimo`, `precio_unitario`, `tipo`, `ubicacion`, `icono`, `descripcion`) VALUES
('prod_001', 'cat_panaderia', 'PAN-001', 'Baguette Tradicional Parisina', 'ud', 91.00, 20.00, 2.50, 'finished_product', 'Mostrador Panadería', '🥖', 'Corteza crujiente y miga alveolada con levadura madre.'),
('prod_002', 'cat_panaderia', 'PAN-002', 'Croissant de Mantequilla', 'ud', 120.00, 25.00, 3.00, 'finished_product', 'Vitrinas POS', '🥐', 'Hojaldre 100% mantequilla de Normandía.'),
('prod_003', 'cat_panaderia', 'PAN-003', 'Pain au Chocolat', 'ud', 35.00, 15.00, 3.50, 'finished_product', 'Vitrinas POS', '🍫', 'Hojaldre relleno de dos barras de chocolate negro 60%.'),
('prod_004', 'cat_panaderia', 'PAN-004', 'Brioche de Vainilla', 'ud', 20.00, 10.00, 4.20, 'finished_product', 'Vitrinas POS', '🍞', 'Pan de huevo esponjoso aromatizado con vainilla de Madagascar.'),
('prod_005', 'cat_panaderia', 'PAN-005', 'Focaccia de Romero y Aceitunas', 'ud', 35.00, 8.00, 5.50, 'finished_product', 'Vitrinas POS', '🫓', 'Pan plano italiano horneado con aceite de oliva extra virgen.'),
('prod_006', 'cat_pasteleria', 'PAS-001', 'Éclair de Chocolate Belga', 'ud', 25.00, 15.00, 4.50, 'finished_product', 'Vitrinas Refrigeradas Pastelería', '⚡', 'Pasta choux rellena de crema pastelera de chocolate oscuro.'),
('prod_007', 'cat_pasteleria', 'PAS-002', 'Tarta de Limón Merengada', 'ud', 18.00, 10.00, 5.00, 'finished_product', 'Vitrinas Refrigeradas', '🍋', 'Base sablée, crema de limón amarillo y merengue tostado.'),
('prod_008', 'cat_pasteleria', 'PAS-003', 'Caja de Macarons Surtidos (6 ud)', 'ud', 30.00, 12.00, 9.50, 'finished_product', 'Vitrinas Refrigeradas', '🍡', 'Selección de pistacho, frambuesa, vainilla, chocolate y café.'),
('prod_009', 'cat_pasteleria', 'PAS-004', 'Milhojas Tradicional de Crema', 'ud', 14.00, 8.00, 4.80, 'finished_product', 'Vitrinas Refrigeradas', '🍰', 'Capas de hojaldre crujiente con crema diplomatica.'),
('prod_010', 'cat_cafeteria', 'BEB-001', 'Café Espresso Doble', 'ud', 100.00, 30.00, 2.80, 'finished_product', 'Barra Cafetería', '☕', 'Grano 100% arábica de tueste medio de origen único.'),
('prod_011', 'cat_cafeteria', 'BEB-002', 'Capuchino Cremoso', 'ud', 80.00, 25.00, 3.80, 'finished_product', 'Barra Cafetería', '🥛', 'Espresso con leche al vapor y espuma suave de canela.'),
('prod_012', 'cat_cafeteria', 'BEB-003', 'Café au Lait Parisien', 'ud', 90.00, 25.00, 3.50, 'finished_product', 'Barra Cafetería', '☕', 'Café de filtro mezclado con leche entera caliente.'),
('prod_013', 'cat_cafeteria', 'BEB-004', 'Jugo de Naranja Recién Exprimido', 'l', 40.00, 15.00, 4.00, 'finished_product', 'Barra Cafetería', '🍊', '100% natural, prensado al momento sin azúcar añadida.'),
('prod_014', 'cat_especialidades', 'ESP-001', 'Croque-Monsieur Tradicional', 'ud', 22.00, 10.00, 7.50, 'finished_product', 'Cocina POS', '🥪', 'Sándwich caliente de jamón cocido, queso Gruyère y bechamel.'),
('prod_015', 'cat_especialidades', 'ESP-002', 'Quiche Lorraine de Bacon', 'ud', 16.00, 8.00, 6.80, 'finished_product', 'Cocina POS', '🥧', 'Tarta salada con tocino ahumado, crema de leche y queso.'),
('prod_016', 'cat_panaderia', 'PAN-006', 'Pan Canilla Tradicional', 'ud', 50.00, 20.00, 1.50, 'finished_product', 'Mostrador Panadería', '🥖', 'Pan canilla clásico de corteza fina y miga ligera y suave.'),
('prod_017', 'cat_panaderia', 'PAN-007', 'Pan de Jamón Navideño Especial', 'ud', 15.00, 5.00, 12.00, 'finished_product', 'Vitrinas Especiales', '🥖', 'Pan relleno con jamón ahumado selecto, tocineta, pasas y aceitunas rellenas.'),
('prod_018', 'cat_panaderia', 'PAN-008', 'Pan Gallego Rústico', 'ud', 20.00, 10.00, 3.50, 'finished_product', 'Mostrador Panadería', '🍞', 'Hogaza de alta hidratación con harina de trigo y masa madre rústica.'),
('prod_019', 'cat_panaderia', 'PAN-009', 'Pan Campestre Integral Multigrano', 'ud', 18.00, 10.00, 3.80, 'finished_product', 'Mostrador Panadería', '🥖', 'Pan de harina integral con mezcla de semillas de chía, lino y sésamo tostado.'),
('prod_020', 'cat_panaderia', 'PAN-010', 'Ciabatta Italiana Rústica', 'ud', 25.00, 12.00, 2.80, 'finished_product', 'Mostrador Panadería', '🫓', 'Pan plano de miga abierta con aceite de oliva extra virgen prensado en frío.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `contacto` varchar(100) NOT NULL,
  `telefono` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `rif` varchar(50) NOT NULL,
  `direccion` text DEFAULT NULL,
  `condicion_pago` varchar(50) DEFAULT 'Crédito 30 días',
  `calificacion` decimal(3,1) DEFAULT 5.0,
  `icono` varchar(20) DEFAULT 'building-2'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `codigo`, `nombre`, `categoria`, `contacto`, `telefono`, `email`, `rif`, `direccion`, `condicion_pago`, `calificacion`, `icono`) VALUES
('sup_01', 'PROV-001', 'Molinos del Sur, C.A.', 'Harinas y Cereales', 'Carlos Mendoza', '(01) 555-MOLINO', 'ventas@molinosdelsur.com', 'J-30819283-4', 'Zona Industrial Sur, Parcela 14, Caracas', 'Crédito 30 días', 4.9, 'wheat'),
('sup_02', 'PROV-002', 'Lácteos La Granja', 'Lácteos y Mantequillas', 'María Elena Suárez', '(01) 555-LACTEOS', 'pedidos@lacteoslagranja.com', 'J-40192837-1', 'Av. Las Acacias, Edif. La Granja, Valencia', 'Contado / 15 días', 4.8, 'milk'),
('sup_03', 'PROV-003', 'Empaques del Norte', 'Empaques y Papelería', 'Roberto Gómez', '(01) 555-EMPAQUE', 'contacto@empaquesnorte.com', 'J-29837482-9', 'Av. Principal Norte, Bodega 5, Maracay', 'Crédito 30 días', 4.7, 'package'),
('sup_04', 'PROV-004', 'Chocolates del Rey', 'Coberturas y Cacao Belga', 'Jean-Philippe Laurent', '(01) 555-CACAO', 'info@chocolatesdelrey.com', 'J-50192834-6', 'Calle Los Artesanos, Qta. Cacao, Los Teques', 'Crédito 15 días', 5.0, 'sparkles');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_accesos`
--

CREATE TABLE `registro_accesos` (
  `id` int(11) NOT NULL,
  `usuario_id` varchar(50) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `ip_origen` varchar(45) NOT NULL,
  `dispositivo` varchar(255) DEFAULT NULL,
  `tipo_intento` varchar(30) NOT NULL DEFAULT 'primario',
  `estado` varchar(20) NOT NULL,
  `detalles` varchar(255) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `registro_accesos`
--

INSERT INTO `registro_accesos` (`id`, `usuario_id`, `username`, `ip_origen`, `dispositivo`, `tipo_intento`, `estado`, `detalles`, `fecha_hora`) VALUES
(1, 'usr_manager', 'admin', '127.0.0.1', 'curl/8.9.1', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA', '2026-10-30 16:14:13'),
(2, 'usr_manager', 'admin', '127.0.0.1', 'curl/8.9.1', '2fa', 'fallido', 'Código 2FA incorrecto', '2026-10-30 16:14:27'),
(3, 'usr_manager', 'admin', '127.0.0.1', 'curl/8.9.1', '2fa', 'exitoso', 'Acceso autorizado con 2FA exitoso', '2026-10-30 16:14:38'),
(4, 'usr_superadmin', 'superadmin', '127.0.0.1', 'curl/8.9.1', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 16:14:51'),
(5, 'usr_superadmin', 'superadmin', '127.0.0.1', 'curl/8.9.1', 'pin_maestro', 'fallido', 'Fallo en PIN Maestro de Superadministrador', '2026-10-30 16:15:05'),
(6, 'usr_superadmin', 'superadmin', '127.0.0.1', 'curl/8.9.1', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 16:15:19'),
(7, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 16:17:35'),
(8, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 16:17:46'),
(9, 'usr_ana', 'cajero1', '::1', 'curl/8.9.1', 'cambio_pin', 'exitoso', 'Superadmin actualizó: PIN Primario (Paso 1) para Ana Ramírez (cajero1)', '2026-10-30 16:30:38'),
(10, 'usr_ana', 'cajero1', '::1', 'curl/8.9.1', 'cambio_pin', 'exitoso', 'Superadmin actualizó: PIN Primario (Paso 1) para Ana Ramírez (cajero1)', '2026-10-30 16:31:02'),
(11, 'usr_ana', 'cajero1', '::1', 'curl/8.9.1', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Código 2FA de Segundo Factor (Paso 2) para Ana Ramírez (cajero1)', '2026-10-30 16:31:06'),
(12, 'usr_superadmin', 'superadmin', '::1', 'curl/8.9.1', 'cambio_pin', 'exitoso', 'Superadmin actualizó: PIN Maestro de Seguridad (Alta Dirección) para Super Administrador (superadmin)', '2026-10-30 16:31:14'),
(13, 'usr_ana', 'cajero1', '::1', 'curl/8.9.1', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Código 2FA de Segundo Factor (Paso 2) para Ana Ramírez (cajero1)', '2026-10-30 16:31:18'),
(14, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 16:31:47'),
(15, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 16:31:51'),
(16, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 16:38:00'),
(17, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 16:38:03'),
(18, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 17:02:08'),
(19, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 17:02:10'),
(20, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA', '2026-10-30 17:02:34'),
(21, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2fa', 'exitoso', 'Acceso autorizado con 2FA exitoso', '2026-10-30 17:02:37'),
(22, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 17:02:50'),
(23, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 17:02:54'),
(24, 'usr_superadmin', 'superadmin', '::1', 'Desconocido', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 17:20:09'),
(25, 'usr_superadmin', 'superadmin', '::1', 'curl/8.9.1', 'pin_maestro', 'fallido', 'Fallo en PIN Maestro de Superadministrador', '2026-10-30 17:20:15'),
(26, 'usr_superadmin', 'superadmin', '::1', 'curl/8.9.1', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 17:20:20'),
(27, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 17:21:02'),
(28, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 20:47:13'),
(29, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 20:47:24'),
(30, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 20:53:06'),
(31, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 20:53:11'),
(32, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 20:54:17'),
(33, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 20:54:18'),
(34, 'usr_baker', 'chef', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA', '2026-10-30 20:54:34'),
(35, 'usr_baker', 'chef', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2fa', 'fallido', 'Código 2FA incorrecto', '2026-10-30 20:54:38'),
(36, 'usr_superadmin', 'superadmin', '::1', 'Desconocido', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro', '2026-10-30 20:57:09'),
(37, 'usr_superadmin', 'superadmin', '::1', 'Desconocido', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:04:28'),
(38, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:04:43'),
(39, 'usr_ana', 'cajero1', '::1', 'Desconocido', '2fa', 'fallido', 'Código 2FA incorrecto', '2026-10-30 21:04:43'),
(40, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 21:11:07'),
(41, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'pin_maestro', 'exitoso', 'Acceso Superadmin autorizado con PIN Maestro de Emergencia', '2026-10-30 21:11:09'),
(42, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA', '2026-10-30 21:11:48'),
(43, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:11:57'),
(44, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere PIN Maestro', '2026-10-30 21:12:05'),
(45, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:19:25'),
(46, 'usr_ana', 'cajero1', '::1', 'Desconocido', '2fa', 'fallido', 'Código 2FA incorrecto', '2026-10-30 21:19:25'),
(47, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'primario', 'fallido', 'Contraseña o PIN primario incorrecto', '2026-10-30 21:24:00'),
(48, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:24:35'),
(49, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 21:24:35'),
(50, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:24:52'),
(51, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 21:24:52'),
(52, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 21:24:52'),
(53, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 21:24:52'),
(54, 'usr_superadmin', 'superadmin', '127.0.0.1', 'Desconocido', 'patron_seguridad', 'exitoso', 'Tercer Factor (Patrón Gestual 3x3) validado. Acceso Superadmin autorizado.', '2026-10-30 21:24:52'),
(55, 'usr_ana', 'cajero1', '127.0.0.1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:25:08'),
(56, 'usr_ana', 'cajero1', '127.0.0.1', 'Desconocido', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:25:08'),
(57, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:26:50'),
(58, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 21:27:00'),
(59, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:27:10'),
(60, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:27:18'),
(61, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:38:00'),
(62, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 21:38:11'),
(63, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Google Authenticator)', '2026-10-30 21:42:26'),
(64, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 21:42:39'),
(65, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Tercer Factor (Patrón Gestual 3x3) validado. Acceso Superadmin autorizado.', '2026-10-30 21:43:24'),
(66, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:56:38'),
(67, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:56:38'),
(68, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:56:39'),
(69, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:56:39'),
(70, 'usr_ana', 'cajero1', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:57:00'),
(71, 'usr_cashier', 'cajero', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 21:57:15'),
(72, 'usr_cashier', 'cajero', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere Patrón Gestual 3x3.', '2026-10-30 21:57:15'),
(73, 'usr_cashier', 'cajero', '::1', 'Desconocido', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 21:57:15'),
(74, 'usr_cashier', 'cajero', '::1', 'Desconocido', 'login_directo', 'exitoso', 'Autenticación exitosa (Sin 2FA requerido)', '2026-10-30 21:57:15'),
(75, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 21:59:59'),
(76, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:00:09'),
(77, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:00:12'),
(78, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', '2026-10-30 22:01:46'),
(79, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:14:23'),
(80, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:14:31'),
(81, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:14:37'),
(82, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:14:40'),
(83, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:14:44'),
(84, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:14:47'),
(85, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 22:14:58'),
(86, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:17:06'),
(87, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:17:17'),
(88, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:17:20'),
(89, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:17:24'),
(90, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:17:33'),
(91, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:17:53'),
(92, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 22:17:55'),
(93, NULL, 'adin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'fallido', 'Usuario no encontrado o no activo', '2026-10-30 22:18:05'),
(94, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 22:18:16'),
(95, 'usr_manager', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 22:18:20'),
(96, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', '2026-10-30 22:18:37'),
(97, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:18:46'),
(98, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:18:52'),
(99, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:18:55'),
(100, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:24:04'),
(101, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:24:17'),
(102, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:24:20'),
(103, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:29:28'),
(104, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:29:40'),
(105, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:29:43'),
(106, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:37:15'),
(107, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:37:18'),
(108, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:37:21'),
(109, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:40:08'),
(110, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 22:40:26'),
(111, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:40:29'),
(112, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Modalidad MFA (patron) para Super Administrador (superadmin)', '2026-10-30 22:40:44'),
(113, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', '2026-10-30 22:40:48'),
(114, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere Patrón Gestual 3x3.', '2026-10-30 22:40:59'),
(115, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 22:41:02'),
(116, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Modalidad MFA (totp) para Super Administrador (superadmin)', '2026-10-30 22:41:10'),
(117, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', '2026-10-30 22:41:12'),
(118, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Modalidad MFA (totp) para Super Administrador (superadmin)', '2026-10-30 22:41:15'),
(119, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 22:41:20'),
(120, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 22:41:24'),
(121, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 22:41:35'),
(122, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 22:41:37'),
(123, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 22:41:39'),
(124, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 22:41:44'),
(125, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Acceso autorizado con código Google Authenticator (TOTP)', '2026-10-30 22:41:47'),
(126, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Modalidad MFA (ambos) para Super Administrador (superadmin)', '2026-10-30 22:41:55'),
(127, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'cambio_pin', 'exitoso', 'Superadmin actualizó: Patrón Gestual 3x3 para Super Administrador (superadmin)', '2026-10-30 22:41:57'),
(128, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 22:53:21'),
(129, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:01:16'),
(130, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:01:19'),
(131, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:01:22'),
(132, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:02:18'),
(133, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:02:23'),
(134, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-30 23:02:25'),
(135, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:02:28'),
(136, 'usr_accountant', 'contador', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: totp)', '2026-10-30 23:13:28'),
(137, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:15:36'),
(138, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:15:40'),
(139, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:15:42'),
(140, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:16:52'),
(141, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:16:56'),
(142, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:16:59'),
(143, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:17:30'),
(144, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:17:35'),
(145, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:17:38'),
(146, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:36:43'),
(147, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:36:46'),
(148, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:36:48'),
(149, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-30 23:44:31'),
(150, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-30 23:44:42'),
(151, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-30 23:44:45'),
(152, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-30 23:44:49'),
(153, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-31 01:21:55'),
(154, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-31 01:22:05'),
(155, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-31 01:22:08'),
(156, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-31 01:22:17'),
(157, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-31 01:22:21'),
(158, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-31 01:22:23'),
(159, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'primario', 'exitoso', 'Paso 1 validado. Requiere 2FA (Tipo: ambos)', '2026-10-31 01:22:29'),
(160, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-31 01:22:33'),
(161, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-31 01:22:34'),
(162, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'fallido', 'Código 2FA / Google Authenticator incorrecto', '2026-10-31 01:22:42'),
(163, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'totp_2fa', 'exitoso', 'Factor 2 (Google Authenticator) verificado. Transición a Factor 3 (Patrón Gestual 3x3).', '2026-10-31 01:22:48'),
(164, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-31 01:22:50'),
(165, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'fallido', 'Patrón gestual incorrecto.', '2026-10-31 01:22:53'),
(166, 'usr_superadmin', 'superadmin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', 'patron_seguridad', 'exitoso', 'Patrón Gestual 3x3 validado exitosamente para Super Administrador.', '2026-10-31 01:22:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_caja_auditoria`
--

CREATE TABLE `reportes_caja_auditoria` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tipo_reporte` varchar(40) NOT NULL,
  `accion` varchar(20) NOT NULL,
  `usuario_id` varchar(50) NOT NULL,
  `usuario_nombre` varchar(150) NOT NULL,
  `rol_codigo` varchar(50) NOT NULL,
  `filtros_consulta` text DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_caja_auditoria`
--

INSERT INTO `reportes_caja_auditoria` (`id`, `tipo_reporte`, `accion`, `usuario_id`, `usuario_nombre`, `rol_codigo`, `filtros_consulta`, `fecha_hora`) VALUES
(1, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:54:58'),
(2, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 17:54:59'),
(3, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:00'),
(4, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 17:55:00'),
(5, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:00'),
(6, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:01'),
(7, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:01'),
(8, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:01'),
(9, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:03'),
(10, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:03'),
(11, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:03'),
(12, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:04'),
(13, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:04'),
(14, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:43'),
(15, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:55:43'),
(16, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:44'),
(17, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:45'),
(18, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:55:56'),
(19, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 17:56:10'),
(20, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:56:10'),
(21, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 17:56:10'),
(22, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 17:56:10'),
(23, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 17:59:57'),
(24, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:00:02'),
(25, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:00:02'),
(26, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:00:02'),
(27, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:00:02'),
(28, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:00:49'),
(29, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:00:52'),
(30, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:01:01'),
(31, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=caja&date=2026-10-23&user_id=usr_superadmin&user_name=Super%20Administrador&role_code=SUPERADMIN&turno=Turno%20Ma%C3%B1ana&bcv_rate=886.2271', '2026-10-23 18:01:13'),
(32, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:01:34'),
(33, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:01:35'),
(34, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:01:35'),
(35, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:01:35'),
(36, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:01:35'),
(37, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-23 18:03:12'),
(38, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:03:14'),
(39, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:03:14'),
(40, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:03:14'),
(41, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:03:14'),
(42, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-23 18:04:40'),
(43, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:15:40'),
(44, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:41'),
(45, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:15:41'),
(46, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:41'),
(47, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:15:42'),
(48, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:42'),
(49, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:15:42'),
(50, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:42'),
(51, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:45'),
(52, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:15:47'),
(53, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:15:47'),
(54, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-23 18:16:08'),
(55, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:16:09'),
(56, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:16:09'),
(57, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:16:09'),
(58, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:16:09'),
(59, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:21:33'),
(60, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:21:34'),
(61, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:21:34'),
(62, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:21:34'),
(63, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:21:34'),
(64, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:25:30'),
(65, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:26:42'),
(66, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:31:37'),
(67, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:31:38'),
(68, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:31:38'),
(69, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:31:38'),
(70, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:31:38'),
(71, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:32:00'),
(72, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:32:06'),
(73, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:32:06'),
(74, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:32:06'),
(75, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:32:07'),
(76, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:32:10'),
(77, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:32:10'),
(78, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:48:54'),
(79, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:48:56'),
(80, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:48:56'),
(81, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:48:56'),
(82, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:48:56'),
(83, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:49:00'),
(84, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23&date_from=2026-10-01&date_to=2026-10-23', '2026-10-23 18:49:03'),
(85, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:49:07'),
(86, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 18:55:28'),
(87, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:55:30'),
(88, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:55:30'),
(89, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 18:55:30'),
(90, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 18:55:30'),
(91, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-23', '2026-10-23 18:58:51'),
(92, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:00:34'),
(93, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:00:34'),
(94, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:00:34'),
(95, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:00:34'),
(96, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:00:34'),
(97, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:00:37'),
(98, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:00:38'),
(99, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:00:38'),
(100, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:00:38'),
(101, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:00:38'),
(102, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:31'),
(103, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:02:32'),
(104, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:32'),
(105, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:02:32'),
(106, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:32'),
(107, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:34'),
(108, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:02:34'),
(109, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:34'),
(110, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:02:34'),
(111, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:34'),
(112, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:36'),
(113, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:36'),
(114, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:36'),
(115, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:02:38'),
(116, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:40'),
(117, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:02:40'),
(118, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:07:34'),
(119, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:07:35'),
(120, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:07:35'),
(121, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:07:35'),
(122, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:07:35'),
(123, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:12:59'),
(124, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:12:59'),
(125, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:12:59'),
(126, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:13:12'),
(127, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:13:13'),
(128, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:13:14'),
(129, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:13:14'),
(130, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:13:14'),
(131, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:13:21'),
(132, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:14:04'),
(133, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:14:04'),
(134, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:14:04'),
(135, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:14:04'),
(136, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:14:04'),
(137, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:14:13'),
(138, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:15:20'),
(139, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:20:42'),
(140, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:22:43'),
(141, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:22:45'),
(142, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:22:45'),
(143, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:22:45'),
(144, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:22:45'),
(145, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:22:47'),
(146, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:22:50'),
(147, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:22:54'),
(148, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:23:03'),
(149, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:25:27'),
(150, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:25:27'),
(151, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:25:27'),
(152, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:25:32'),
(153, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:25:41'),
(154, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:27:27'),
(155, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:27:29'),
(156, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:27:29'),
(157, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:27:29'),
(158, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:27:29'),
(159, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:36:58'),
(160, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:36:58'),
(161, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:36:58'),
(162, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:36:58'),
(163, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:36:58'),
(164, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:37:04'),
(165, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:39:20'),
(166, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:39:21'),
(167, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:39:21'),
(168, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 19:39:21'),
(169, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:39:21'),
(170, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:39:23'),
(171, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:48:49'),
(172, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:48:49'),
(173, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-23&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 19:48:49'),
(174, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:48:50'),
(175, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 19:48:50'),
(176, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 20:02:13'),
(177, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 20:02:14'),
(178, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 20:02:14'),
(179, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-23 20:02:14'),
(180, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 20:02:14'),
(181, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-23', '2026-10-23 20:02:15'),
(182, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 20:02:30'),
(183, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 20:02:30'),
(184, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 20:02:30'),
(185, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-23 21:50:08'),
(186, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 09:42:08'),
(187, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:42:08'),
(188, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:42:08'),
(189, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:42:08'),
(190, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:42:08'),
(191, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 09:42:09'),
(192, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 09:42:09'),
(193, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 09:52:32'),
(194, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:52:34'),
(195, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:52:35'),
(196, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:52:35'),
(197, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:52:35'),
(198, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 09:52:38'),
(199, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:52:44'),
(200, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:52:44'),
(201, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 09:52:44'),
(202, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 09:52:44'),
(203, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 10:29:38'),
(204, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 10:29:46'),
(205, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 10:29:46'),
(206, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 10:29:46'),
(207, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 10:29:46'),
(208, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 10:29:56'),
(209, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 10:54:33'),
(210, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 10:54:34'),
(211, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 10:54:34'),
(212, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 10:54:34'),
(213, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 10:54:34'),
(214, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:02:56'),
(215, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:03:06'),
(216, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:03:06'),
(217, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:03:06'),
(218, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:03:06'),
(219, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:09:25'),
(220, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:09:25'),
(221, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:09:25'),
(222, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:09:26'),
(223, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:09:26'),
(224, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:10:26'),
(225, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:10:51'),
(226, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:16:30'),
(227, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:18:42'),
(228, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:25:08'),
(229, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:26:15'),
(230, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:26:23'),
(231, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:26:24'),
(232, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:26:24'),
(233, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:26:24'),
(234, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:27:38'),
(235, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:27:45'),
(236, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:27:45'),
(237, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:27:45'),
(238, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:27:45'),
(239, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:29:41'),
(240, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:29:54');
INSERT INTO `reportes_caja_auditoria` (`id`, `tipo_reporte`, `accion`, `usuario_id`, `usuario_nombre`, `rol_codigo`, `filtros_consulta`, `fecha_hora`) VALUES
(241, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:30:16'),
(242, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:30:17'),
(243, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:30:17'),
(244, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:30:18'),
(245, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 11:32:33'),
(246, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:32:45'),
(247, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:32:45'),
(248, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:32:45'),
(249, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:32:45'),
(250, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 11:35:59'),
(251, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:36:11'),
(252, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:36:11'),
(253, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:36:11'),
(254, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:36:11'),
(255, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 11:58:39'),
(256, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:58:48'),
(257, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:58:48'),
(258, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 11:58:48'),
(259, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:58:48'),
(260, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 11:58:57'),
(261, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:06:34'),
(262, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:06:42'),
(263, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:06:42'),
(264, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:06:42'),
(265, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:06:42'),
(266, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:06:56'),
(267, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:07:04'),
(268, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:07:14'),
(269, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:07:39'),
(270, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza', '2026-10-24 12:07:46'),
(271, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 12:08:19'),
(272, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 12:09:02'),
(273, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:09:11'),
(274, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:09:11'),
(275, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:09:11'),
(276, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:09:12'),
(277, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 12:25:00'),
(278, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:25:05'),
(279, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:25:05'),
(280, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:25:05'),
(281, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:25:05'),
(282, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 12:31:58'),
(283, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:32:00'),
(284, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:32:00'),
(285, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 12:32:00'),
(286, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:32:00'),
(287, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 12:33:04'),
(288, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-24&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador', '2026-10-24 13:38:40'),
(289, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 13:38:41'),
(290, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 13:38:41'),
(291, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-24 13:38:41'),
(292, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 13:38:41'),
(293, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-24', '2026-10-24 13:38:47'),
(294, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_ana', 'Ana Ramírez', 'CASHIER', 'context=caja&date=2026-10-29&turno=Turno%20Ma%C3%B1ana&role_code=POS', '2026-10-29 20:52:10'),
(295, 'CIERRE_CAJA_Z', 'GENERACION', 'usr_cashier', 'Henry POS', 'CASHIER', 'context=caja&action=generate&date=2026-10-29&user_id=usr_cashier&user_name=Henry%20POS&role_code=POS&turno=Turno%20Ma%C3%B1ana&tasa_bcv=784.66&monto_efectivo_real=15.5&observaciones=Prueba%20de%20cierre&force=1&confirm_empty=1', '2026-10-29 20:53:16'),
(296, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&date_from=2026-10-01&date_to=2026-10-31', '2026-10-29 20:53:23'),
(297, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_ana', 'Ana Ramírez', 'CASHIER', 'context=caja&date=2026-10-29&turno=Turno%20Ma%C3%B1ana&role_code=POS', '2026-10-29 21:00:25'),
(298, 'CIERRE_CAJA_Z', 'GENERACION', 'usr_cashier', 'Henry POS', 'CASHIER', 'context=caja&action=generate&date=2026-10-29&user_id=usr_cashier&user_name=Henry%20POS&role_code=POS&turno=Turno%20Ma%C3%B1ana&tasa_bcv=784.66&monto_efectivo_real=15.5&observaciones=Prueba%20de%20cierre&force=1&confirm_empty=1', '2026-10-29 21:00:33'),
(299, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&date_from=2026-10-01&date_to=2026-10-31', '2026-10-29 21:00:39'),
(300, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_ana', 'Ana Ramírez', 'CASHIER', 'context=caja&date=2026-10-29&turno=Turno%20Ma%C3%B1ana&role_code=POS', '2026-10-29 21:03:29'),
(301, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&role_code=ADMIN&user_id=usr_manager&fecha_desde=2026-10-01&fecha_hasta=2026-10-31&date_from=2026-10-01&date_to=2026-10-31&shift=todos', '2026-10-29 21:03:36'),
(302, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:25'),
(303, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:26'),
(304, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-29 21:44:31'),
(305, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:44:31'),
(306, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-29 21:44:31'),
(307, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:44:31'),
(308, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:44:37'),
(309, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:44'),
(310, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:44'),
(311, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:44'),
(312, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:44:52'),
(313, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:44:52'),
(314, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:54'),
(315, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:54'),
(316, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:44:54'),
(317, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:45:12'),
(318, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(319, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(320, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(321, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(322, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(323, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:51'),
(324, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-29 21:46:53'),
(325, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-29 21:47:03'),
(326, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:47:03'),
(327, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-29 21:47:03'),
(328, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-29', '2026-10-29 21:47:03'),
(329, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:16:34'),
(330, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:16:35'),
(331, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:16:50'),
(332, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:16:50'),
(333, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:16:50'),
(334, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:16:50'),
(335, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:16:56'),
(336, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:42:16'),
(337, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:42:18'),
(338, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:42:18'),
(339, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:42:18'),
(340, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:42:18'),
(341, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:42:19'),
(342, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:42:19'),
(343, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:42:21'),
(344, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:42:21'),
(345, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:44:01'),
(346, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:44:04'),
(347, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:56:03'),
(348, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 09:56:10'),
(349, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:56:19'),
(350, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:56:20'),
(351, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:56:20'),
(352, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:56:28'),
(353, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:56:28'),
(354, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:56:28'),
(355, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:56:28'),
(356, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:56:30'),
(357, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:56:30'),
(358, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:56:30'),
(359, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:56:59'),
(360, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:56:59'),
(361, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 09:59:31'),
(362, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:59:33'),
(363, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 09:59:33'),
(364, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:59:33'),
(365, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:59:33'),
(366, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 09:59:33'),
(367, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:59:33'),
(368, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:59:34'),
(369, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 09:59:34'),
(370, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:40:00'),
(371, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:40:00'),
(372, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:40:00'),
(373, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:40:04'),
(374, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:40:04'),
(375, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:40:04'),
(376, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:40:04'),
(377, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:40:08'),
(378, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:40:16'),
(379, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:41:47'),
(380, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:41:47'),
(381, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:41:48'),
(382, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:42:33'),
(383, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:43:25'),
(384, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:43:25'),
(385, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:43:27'),
(386, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:43:27'),
(387, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:43:27'),
(388, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:43:27'),
(389, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:49:36'),
(390, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:49:38'),
(391, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:49:38'),
(392, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:49:58'),
(393, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:49:58'),
(394, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:49:58'),
(395, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:49:58'),
(396, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:50:19'),
(397, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:50:23'),
(398, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 14:58:24'),
(399, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:58:25'),
(400, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 14:58:25'),
(401, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:58:34'),
(402, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:58:34'),
(403, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 14:58:34'),
(404, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:58:34'),
(405, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:58:43'),
(406, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30&date_from=2026-10-01&date_to=2026-10-30&shift=todos', '2026-10-30 14:58:46'),
(407, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30&date_from=2026-10-01&date_to=2026-10-30', '2026-10-30 14:58:50'),
(408, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:59:08'),
(409, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 14:59:15'),
(410, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:52:31'),
(411, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:53:25'),
(412, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:53:25'),
(413, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:53:44'),
(414, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:53:45'),
(415, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:53:45'),
(416, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 15:53:59'),
(417, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:53:59'),
(418, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 15:53:59'),
(419, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:53:59'),
(420, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:54:21'),
(421, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:54:35'),
(422, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:54:36'),
(423, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 15:54:36'),
(424, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 15:54:37'),
(425, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:54:37'),
(426, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 15:54:37'),
(427, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:54:37'),
(428, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:54:40'),
(429, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:54:40'),
(430, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:54:40'),
(431, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:54:41'),
(432, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 15:54:41'),
(433, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 15:55:01'),
(434, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:01:01'),
(435, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:01:01'),
(436, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:01:01'),
(437, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:17:48'),
(438, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:31:52'),
(439, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:38:04'),
(440, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 16:38:12'),
(441, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 17:02:11'),
(442, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 17:02:38'),
(443, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-30&fecha_desde=2026-01-01&fecha_hasta=2026-10-30&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 17:02:55'),
(444, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 20:47:26'),
(445, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 20:53:11'),
(446, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 20:54:19'),
(447, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 21:11:11'),
(448, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 21:11:57'),
(449, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 21:27:19'),
(450, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 21:38:11'),
(451, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 21:43:25'),
(452, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:00:14'),
(453, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_manager', 'Juan Mendoza', 'ADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_manager&role_code=ADMIN&user_name=Juan%20Mendoza&shift=todos', '2026-10-30 22:18:21'),
(454, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:18:56');
INSERT INTO `reportes_caja_auditoria` (`id`, `tipo_reporte`, `accion`, `usuario_id`, `usuario_nombre`, `rol_codigo`, `filtros_consulta`, `fecha_hora`) VALUES
(455, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:24:21'),
(456, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:29:44'),
(457, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:37:22'),
(458, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:40:30'),
(459, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:41:03'),
(460, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:41:25'),
(461, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 22:41:47'),
(462, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:01:24'),
(463, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:29'),
(464, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 23:02:30'),
(465, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=GERENTE&user_id=usr_superadmin&fecha_desde=2026-10-16&fecha_hasta=2026-10-30', '2026-10-30 23:02:30'),
(466, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 23:02:31'),
(467, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 23:02:31'),
(468, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente', '2026-10-30 23:02:31'),
(469, 'DETALLE_VENTAS_COBROS', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&role_code=SUPERADMIN&user_id=usr_superadmin&fecha_desde=2026-10-01&fecha_hasta=2026-10-30', '2026-10-30 23:02:31'),
(470, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:34'),
(471, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:35'),
(472, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:46'),
(473, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:48'),
(474, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:48'),
(475, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:48'),
(476, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:02:59'),
(477, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:15:43'),
(478, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:15:54'),
(479, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:17:00'),
(480, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:17:39'),
(481, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:36:49'),
(482, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:44:50'),
(483, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-30 23:57:29'),
(484, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-31 01:22:10'),
(485, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-31 01:22:24'),
(486, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-10-31&fecha_desde=2026-01-01&fecha_hasta=2026-10-31&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-10-31 01:22:57'),
(487, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-01 22:27:57'),
(488, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 07:44:49'),
(489, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 16:16:11'),
(490, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 16:17:58'),
(491, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 16:40:23'),
(492, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 17:18:08'),
(493, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-02&fecha_desde=2026-01-01&fecha_hasta=2026-11-02&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-02 17:18:39'),
(494, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-04&fecha_desde=2026-01-01&fecha_hasta=2026-11-04&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-03 22:19:01'),
(495, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-04&fecha_desde=2026-01-01&fecha_hasta=2026-11-04&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-03 22:19:23'),
(496, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-04&fecha_desde=2026-01-01&fecha_hasta=2026-11-04&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-04 08:28:47'),
(497, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_superadmin', 'Super Administrador', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-04&fecha_desde=2026-01-01&fecha_hasta=2026-11-04&user_id=usr_superadmin&role_code=SUPERADMIN&user_name=Super%20Administrador&shift=todos', '2026-11-04 08:39:12'),
(498, 'CIERRE_CAJA_Z', 'CONSULTA', 'usr_wiston_16', 'Wiston Smith', 'SUPERADMIN', 'context=gerente&date_from=2026-01-01&date_to=2026-11-04&fecha_desde=2026-01-01&fecha_hasta=2026-11-04&user_id=usr_wiston_16&role_code=SUPERADMIN&user_name=Wiston%20Smith&shift=todos', '2026-11-04 08:41:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_caja_cierres`
--

CREATE TABLE `reportes_caja_cierres` (
  `id` varchar(50) NOT NULL,
  `codigo_reporte` varchar(50) NOT NULL,
  `fecha_turno` date NOT NULL,
  `caja_id` varchar(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` varchar(100) NOT NULL,
  `ventas_brutas` decimal(12,2) NOT NULL DEFAULT 0.00,
  `descuentos` decimal(12,2) NOT NULL DEFAULT 0.00,
  `devoluciones` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ventas_netas` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(14,2) NOT NULL DEFAULT 0.00,
  `tasa_bcv` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `monto_efectivo_esperado` decimal(12,2) NOT NULL DEFAULT 0.00,
  `monto_efectivo_real` decimal(12,2) NOT NULL DEFAULT 0.00,
  `diferencia_efectivo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `facturas_emitidas` int(11) NOT NULL DEFAULT 0,
  `facturas_anuladas` int(11) NOT NULL DEFAULT 0,
  `cerrado_sin_ventas` tinyint(1) NOT NULL DEFAULT 0,
  `mensaje_cierre` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `detalle_pagos_json` longtext DEFAULT NULL,
  `firma_cajero` varchar(150) DEFAULT NULL,
  `firma_supervisor` varchar(150) DEFAULT NULL,
  `generado_por` varchar(50) NOT NULL,
  `generado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_caja_cierres`
--

INSERT INTO `reportes_caja_cierres` (`id`, `codigo_reporte`, `fecha_turno`, `caja_id`, `turno`, `ventas_brutas`, `descuentos`, `devoluciones`, `ventas_netas`, `total_bs`, `tasa_bcv`, `monto_efectivo_esperado`, `monto_efectivo_real`, `diferencia_efectivo`, `facturas_emitidas`, `facturas_anuladas`, `cerrado_sin_ventas`, `mensaje_cierre`, `observaciones`, `detalle_pagos_json`, `firma_cajero`, `firma_supervisor`, `generado_por`, `generado_en`) VALUES
('cz_20261029210033_cda756', 'Z-20261029-20A996', '2026-10-29', 'POS-PRINCIPAL', 'Turno Mañana', 15.50, 0.00, 0.00, 15.50, 12162.23, 784.6600, 15.50, 15.50, 0.00, 1, 0, 0, 'Cierre Z generado y sellado exitosamente.', 'Prueba de cierre', '[{\"metodo_pago\":\"Efectivo\",\"transacciones\":1,\"monto\":15.5}]', 'Henry POS', NULL, 'usr_cashier', '2026-10-29 21:00:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_caja_eventos`
--

CREATE TABLE `reportes_caja_eventos` (
  `id` varchar(50) NOT NULL,
  `venta_id` varchar(50) DEFAULT NULL,
  `codigo_venta` varchar(50) NOT NULL,
  `caja_id` varchar(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` varchar(100) DEFAULT NULL,
  `usuario_id` varchar(50) DEFAULT NULL,
  `tipo_evento` varchar(30) NOT NULL,
  `estatus` varchar(30) NOT NULL DEFAULT 'COMPLETADA',
  `metodo_pago` varchar(50) DEFAULT NULL,
  `referencia_lote` varchar(100) DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `motivo` varchar(255) DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp(),
  `registrado_por` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_caja_eventos`
--

INSERT INTO `reportes_caja_eventos` (`id`, `venta_id`, `codigo_venta`, `caja_id`, `turno`, `usuario_id`, `tipo_evento`, `estatus`, `metodo_pago`, `referencia_lote`, `monto`, `motivo`, `fecha_hora`, `registrado_por`) VALUES
('ev_1793321523_853', 'sale_1793321523_918', 'FAC-2026-TEST', 'POS-PRINCIPAL', 'Mañana (07:00 - 15:00)', 'usr_cashier', 'VENTA_REGISTRADA', 'COMPLETADA', 'efectivo', 'LOTE-20261029', 15.50, 'Venta cobrada en caja', '2026-10-29 20:52:03', 'Henry POS');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_caja_venta_meta`
--

CREATE TABLE `reportes_caja_venta_meta` (
  `venta_id` varchar(50) NOT NULL,
  `caja_id` varchar(50) NOT NULL DEFAULT 'POS-PRINCIPAL',
  `turno` varchar(100) DEFAULT NULL,
  `referencia_lote` varchar(100) DEFAULT NULL,
  `estatus` varchar(30) NOT NULL DEFAULT 'COMPLETADA',
  `actualizado_por` varchar(50) DEFAULT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_caja_venta_meta`
--

INSERT INTO `reportes_caja_venta_meta` (`venta_id`, `caja_id`, `turno`, `referencia_lote`, `estatus`, `actualizado_por`, `actualizado_en`) VALUES
('sale_1793321523_918', 'POS-PRINCIPAL', 'Mañana (07:00 - 15:00)', 'LOTE-20261029', 'COMPLETADA', 'usr_cashier', '2026-10-30 00:52:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `redirect_url` varchar(255) NOT NULL DEFAULT 'modules/dashboard.html'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `codigo`, `nombre`, `descripcion`, `redirect_url`) VALUES
('rol_accountant', 'ACCOUNTANT', 'Contador & Administrador', 'Auditoría financiera, balance de comprobación y órdenes de compra.', 'modules/accounting.html'),
('rol_admin', 'ADMIN', 'Gerente General / Administrador', 'Acceso total a KPIs, contabilidad, personal, inventario y configuración.', 'modules/dashboard.html'),
('rol_baker', 'BAKER', 'Maestro Panadero / Chef de Cuisine', 'Gestión de hornos industriales, comandas KDS e insumos de masa.', 'modules/kitchen.html'),
('rol_cashier', 'CASHIER', 'Personal de Caja / POS', 'Facturación directa, cobro en efectivo/tarjeta y arqueo de caja.', 'modules/pos.html'),
('rol_superadmin', 'SUPERADMIN', 'Super Administrador', 'Acceso total e irrestricto a todos los módulos y funciones del sistema.', 'modules/dashboard.html');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` varchar(50) NOT NULL,
  `rol_id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `pin` varchar(255) NOT NULL DEFAULT '1234',
  `icono` varchar(20) DEFAULT 'shield-check',
  `turno` varchar(100) DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'active',
  `pin_2fa` varchar(255) NOT NULL DEFAULT '123456',
  `pin_maestro` varchar(255) NOT NULL DEFAULT '990022',
  `totp_secret` varchar(64) DEFAULT NULL,
  `totp_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `patron_seguridad` varchar(64) DEFAULT '0-3-6-7-8',
  `mfa_tipo` varchar(20) NOT NULL DEFAULT 'totp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `rol_id`, `codigo`, `username`, `nombre`, `email`, `telefono`, `pin`, `icono`, `turno`, `estado`, `pin_2fa`, `pin_maestro`, `totp_secret`, `totp_enabled`, `patron_seguridad`, `mfa_tipo`) VALUES
('usr_accountant', 'rol_accountant', 'EMP-006', 'contador', 'Sebastian Finanzas', 'sebastian.finanzas@parisienne.com', '(01) 555-SEBASTIAN', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'bar-chart-3', 'Horario Oficina (08:00 - 17:00)', 'active', '123456', '990022', 'QYT7DO36CZ34O6T3', 1, '0-3-6-7-8', 'totp'),
('usr_ana', 'rol_cashier', 'EMP-002', 'cajero1', 'Ana Ramírez', 'ana.ramirez@parisienne.com', '(01) 555-ANA', '$2y$10$oJhK4R7xA2IvIvc8o3Af2.U8GoWhjLyGxt6eKryf6R/D7tLzaiTdS', 'banknote', 'Tarde (13:00 - 21:00)', 'active', '$2y$10$iM0tT9jHfLbtJcbc23XMUuyS9xq1vU8mRUzp6YeqY6yuKBXg95wOS', '990022', 'NQRQ6EXXZKDYDWSM', 1, '0-3-6-7-8', 'totp'),
('usr_baker', 'rol_baker', 'EMP-004', 'chef', 'Enrique Chef', 'enrique.chef@parisienne.com', '(01) 555-ENRIQUE', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'chef-hat', 'Mañana (05:00 - 13:00)', 'active', '123456', '990022', '6XG7UZKTRPABJRQ2', 1, '0-3-6-7-8', 'totp'),
('usr_carlos', 'rol_baker', 'EMP-001', 'panadero', 'Carlos Mendoza', 'carlos.mendoza@parisienne.com', '(01) 555-CARLOS', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'chef-hat', 'Mañana (05:00 - 13:00)', 'active', '123456', '990022', '7SCBPHC2A3UDWU3R', 1, '0-3-6-7-8', 'totp'),
('usr_cashier', 'rol_cashier', 'EMP-005', 'cajero', 'Henry POS', 'henry.pos@parisienne.com', '(01) 555-HENRY', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'shield-check', 'Mañana (07:00 - 15:00)', 'active', '123456', '990022', 'ZJDTC5OYDDCC3HLC', 1, '0-3-6-7-8', 'totp'),
('usr_manager', 'rol_admin', 'EMP-003', 'admin', 'Juan Mendoza', 'juan.gerente@parisienne.com', '(01) 555-JUAN', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'shield-check', 'Turno Completo', 'active', '123456', '990022', '2BQBPLKXOGVBWEFG', 1, '0-3-6-7-8', 'totp'),
('usr_superadmin', 'rol_superadmin', 'EMP-000', 'superadmin', 'Super Administrador', 'superadmin@parisienne.com', '(01) 555-SUPER', '$2y$10$jwa/slzZEcl7pDrjsKx7SepJ8aGbhmpChMm6tz4LBtJouXE/s5bly', 'shield-check', 'Acceso Total 24/7', 'active', '123456', '$2y$10$RaYoDI3ZspHwb2dZUdekgOWu/bWr3m.wazduNpywpx.XqRE4LNX.O', '4NPNBUQA7UMCBF56', 1, '0-3-6-7-8', 'ambos'),
('usr_wiston_16', 'rol_superadmin', 'EMP-008', 'Director', 'Wiston Smith', 'wiston@lanuevaparisienne.com', '(01) 555-PARIS', '$2y$10$V0w24/LoyrY14pXbgzcXXuUMHUG9libhEVBjIdlpJkwZ6fKIDgWGK', 'shield-check', 'Turno Completo', 'active', '$2y$10$YYEqZMa33PqW1Uq.YdJ0MObnuZpuUqgzEaPOxqGBWPy9HerkciiRm', '$2y$10$WXm6qwdE6X2qFhwkoq2U7.yCB97argH3jETe8DZ0Sc2LolihtgiU6', NULL, 0, '0-3-6-7-8', 'patron');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` varchar(50) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `usuario_id` varchar(50) NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp(),
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `iva` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tasa_bcv` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `total_bs` decimal(16,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` varchar(50) NOT NULL DEFAULT 'Efectivo',
  `monto_pagado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cambio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tipo_pedido` varchar(50) DEFAULT 'Para Llevar'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `codigo`, `usuario_id`, `fecha_hora`, `subtotal`, `iva`, `descuento`, `total`, `tasa_bcv`, `total_bs`, `metodo_pago`, `monto_pagado`, `cambio`, `tipo_pedido`) VALUES
('sale_1793321523_918', 'FAC-2026-TEST', 'usr_cashier', '2026-10-29 20:52:03', 15.50, 2.48, 0.00, 15.50, 1.0000, 17.98, 'efectivo', 15.50, 0.00, 'Para Llevar');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas_detalle`
--

CREATE TABLE `ventas_detalle` (
  `id` int(11) NOT NULL,
  `venta_id` varchar(50) NOT NULL,
  `producto_id` varchar(50) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal_linea` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ventas_detalle`
--

INSERT INTO `ventas_detalle` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio_unitario`, `subtotal_linea`) VALUES
(1, 'sale_1793321523_918', 'prod_001', 2, 2.50, 5.00);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asientos_contables`
--
ALTER TABLE `asientos_contables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_asientos_fecha` (`fecha_hora`),
  ADD KEY `idx_asientos_modulo` (`modulo_origen`);

--
-- Indices de la tabla `asientos_detalle`
--
ALTER TABLE `asientos_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_asientos_detalle_asiento` (`asiento_id`),
  ADD KEY `idx_asientos_detalle_cuenta` (`cuenta_codigo`);

--
-- Indices de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_modulo_accion` (`modulo`,`accion`),
  ADD KEY `idx_usuario` (`user_id`),
  ADD KEY `idx_fecha` (`creado_en`),
  ADD KEY `idx_severidad` (`severidad`),
  ADD KEY `idx_hash_firma` (`hash_firma`);

--
-- Indices de la tabla `categorias_producto`
--
ALTER TABLE `categorias_producto`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `comandas_cocina`
--
ALTER TABLE `comandas_cocina`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comandas_estado` (`estado_preparacion`),
  ADD KEY `idx_comandas_fecha` (`fecha_hora`);

--
-- Indices de la tabla `configuraciones`
--
ALTER TABLE `configuraciones`
  ADD PRIMARY KEY (`clave`);

--
-- Indices de la tabla `configuracion_empresa`
--
ALTER TABLE `configuracion_empresa`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estado_hornos`
--
ALTER TABLE `estado_hornos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_hornos_lotes` (`lote_id`),
  ADD KEY `idx_hornos_estado` (`estado`);

--
-- Indices de la tabla `lotes_produccion`
--
ALTER TABLE `lotes_produccion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lotes_estado` (`estado_leudado`),
  ADD KEY `idx_lotes_producto` (`codigo_producto`);

--
-- Indices de la tabla `materias_primas`
--
ALTER TABLE `materias_primas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_materias_primas_proveedor` (`proveedor_id`);

--
-- Indices de la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_ordenes_proveedores` (`proveedor_id`),
  ADD KEY `idx_ordenes_fecha` (`fecha_pedido`),
  ADD KEY `idx_ordenes_estado` (`estado`);

--
-- Indices de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ordenes_compra_detalle_materia_prima` (`materia_prima_id`),
  ADD KEY `idx_ordenes_detalle_orden` (`orden_id`);

--
-- Indices de la tabla `plan_cuentas`
--
ALTER TABLE `plan_cuentas`
  ADD PRIMARY KEY (`codigo`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_productos_categorias` (`categoria_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `registro_accesos`
--
ALTER TABLE `registro_accesos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_accesos_fecha` (`fecha_hora`),
  ADD KEY `idx_accesos_user` (`usuario_id`,`estado`);

--
-- Indices de la tabla `reportes_caja_auditoria`
--
ALTER TABLE `reportes_caja_auditoria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reportes_caja_auditoria_fecha` (`fecha_hora`),
  ADD KEY `idx_reportes_caja_auditoria_tipo` (`tipo_reporte`),
  ADD KEY `idx_reportes_caja_auditoria_usuario` (`usuario_id`);

--
-- Indices de la tabla `reportes_caja_cierres`
--
ALTER TABLE `reportes_caja_cierres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_reporte` (`codigo_reporte`),
  ADD KEY `idx_reportes_caja_cierres_fecha` (`fecha_turno`),
  ADD KEY `idx_reportes_caja_cierres_caja` (`caja_id`),
  ADD KEY `idx_reportes_caja_cierres_generado_por` (`generado_por`);

--
-- Indices de la tabla `reportes_caja_eventos`
--
ALTER TABLE `reportes_caja_eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_reportes_caja_evento_venta` (`venta_id`),
  ADD KEY `idx_reportes_caja_eventos_fecha` (`fecha_hora`),
  ADD KEY `idx_reportes_caja_eventos_caja` (`caja_id`),
  ADD KEY `idx_reportes_caja_eventos_turno` (`turno`),
  ADD KEY `idx_reportes_caja_eventos_usuario` (`usuario_id`),
  ADD KEY `idx_reportes_caja_eventos_tipo` (`tipo_evento`),
  ADD KEY `idx_reportes_caja_eventos_referencia` (`referencia_lote`);

--
-- Indices de la tabla `reportes_caja_venta_meta`
--
ALTER TABLE `reportes_caja_venta_meta`
  ADD PRIMARY KEY (`venta_id`),
  ADD KEY `idx_reportes_caja_meta_caja` (`caja_id`),
  ADD KEY `idx_reportes_caja_meta_turno` (`turno`),
  ADD KEY `idx_reportes_caja_meta_estatus` (`estatus`),
  ADD KEY `idx_reportes_caja_meta_referencia` (`referencia_lote`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_usuarios_roles` (`rol_id`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_ventas_usuarios` (`usuario_id`),
  ADD KEY `idx_ventas_fecha` (`fecha_hora`),
  ADD KEY `idx_ventas_metodo` (`metodo_pago`),
  ADD KEY `idx_ventas_fecha_total` (`fecha_hora`,`total`);

--
-- Indices de la tabla `ventas_detalle`
--
ALTER TABLE `ventas_detalle`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ventas_detalle_venta` (`venta_id`),
  ADD KEY `idx_ventas_detalle_producto` (`producto_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asientos_detalle`
--
ALTER TABLE `asientos_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `bitacora`
--
ALTER TABLE `bitacora`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT de la tabla `configuracion_empresa`
--
ALTER TABLE `configuracion_empresa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `registro_accesos`
--
ALTER TABLE `registro_accesos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=167;

--
-- AUTO_INCREMENT de la tabla `reportes_caja_auditoria`
--
ALTER TABLE `reportes_caja_auditoria`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=499;

--
-- AUTO_INCREMENT de la tabla `ventas_detalle`
--
ALTER TABLE `ventas_detalle`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asientos_detalle`
--
ALTER TABLE `asientos_detalle`
  ADD CONSTRAINT `fk_asientos_detalle_cuentas` FOREIGN KEY (`cuenta_codigo`) REFERENCES `plan_cuentas` (`codigo`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_asientos_detalle_encabezado` FOREIGN KEY (`asiento_id`) REFERENCES `asientos_contables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `estado_hornos`
--
ALTER TABLE `estado_hornos`
  ADD CONSTRAINT `fk_hornos_lotes` FOREIGN KEY (`lote_id`) REFERENCES `lotes_produccion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `materias_primas`
--
ALTER TABLE `materias_primas`
  ADD CONSTRAINT `fk_materias_primas_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `ordenes_compra`
--
ALTER TABLE `ordenes_compra`
  ADD CONSTRAINT `fk_ordenes_proveedores` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ordenes_compra_detalle`
--
ALTER TABLE `ordenes_compra_detalle`
  ADD CONSTRAINT `fk_ordenes_compra_detalle_materia_prima` FOREIGN KEY (`materia_prima_id`) REFERENCES `materias_primas` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ordenes_compra_detalle_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categorias` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `reportes_caja_eventos`
--
ALTER TABLE `reportes_caja_eventos`
  ADD CONSTRAINT `fk_reportes_caja_evento_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `reportes_caja_venta_meta`
--
ALTER TABLE `reportes_caja_venta_meta`
  ADD CONSTRAINT `fk_reportes_caja_meta_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_ventas_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `ventas_detalle`
--
ALTER TABLE `ventas_detalle`
  ADD CONSTRAINT `fk_ventas_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ventas_detalle_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
