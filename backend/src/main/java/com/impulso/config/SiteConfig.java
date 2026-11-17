package com.impulso.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

// Em produção, o site (o build do React) vai dentro do backend, na pasta static (veja o Dockerfile).
// Um endereço que não é arquivo nem /api, como /alunos/3, devolve o index.html, e o React abre a
// tela certa. No computador a pasta static fica vazia e o site continua no Vite (porta 5173).
@Configuration
public class SiteConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry){
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String caminho, Resource pasta) throws IOException {
                        Resource arquivo = pasta.createRelative(caminho);
                        if(arquivo.exists() && arquivo.isReadable()){
                            return arquivo;
                        }
                        Resource index = pasta.createRelative("index.html");
                        return caminho.startsWith("api/") || !index.exists() ? null : index;
                    }
                });
    }
}
